const CATEGORIES = [
  "Chicken",
  "Beef",
  "Vegetarian",
  "Pasta",
  "Seafood",
  "Lamb",
  "Dessert",
  "Side",
];

const COOKING_TIMES = {
  Chicken: 35,
  Beef: 50,
  Vegetarian: 25,
  Pasta: 20,
  Seafood: 20,
  Lamb: 60,
  Dessert: 35,
  Side: 20,
};

const NUTRITION_EST = {
  Chicken: { calories: 380, protein: 35, carbs: 20, fat: 12 },
  Beef: { calories: 480, protein: 38, carbs: 18, fat: 22 },
  Vegetarian: { calories: 280, protein: 12, carbs: 40, fat: 8 },
  Pasta: { calories: 420, protein: 18, carbs: 58, fat: 10 },
  Seafood: { calories: 320, protein: 32, carbs: 15, fat: 10 },
  Lamb: { calories: 450, protein: 36, carbs: 12, fat: 24 },
  Dessert: { calories: 380, protein: 6, carbs: 52, fat: 15 },
  Side: { calories: 180, protein: 8, carbs: 30, fat: 6 },
  default: { calories: 350, protein: 20, carbs: 35, fat: 12 },
};

function parseIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] || "").trim();
    const measure = (meal[`strMeasure${i}`] || "").trim();
    if (name) {
      const parts = measure.split(" ");
      const amount = parts[0] || "";
      const unit = parts.slice(1).join(" ") || "";
      ingredients.push({ name, amount, unit });
    }
  }
  return ingredients;
}

function parseSteps(instructions) {
  if (!instructions) return [];
  const lines = instructions
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const steps = lines
    .map((instruction, i) => ({
      order: i + 1,
      instruction: instruction
        .replace(/^\d+[\.\)]\s*/, "")
        .replace(/^STEP\s+\d+[\.:]\s*/i, "")
        .trim(),
      tip: "",
      whyItMatters: "",
    }))
    .filter((s) => s.instruction.length > 0);

  return steps.length > 0
    ? steps
    : [
        {
          order: 1,
          instruction: instructions.slice(0, 500),
          tip: "",
          whyItMatters: "",
        },
      ];
}

function estimateDifficulty(ingredients, steps, cookingTime) {
  const HARD_TECHNIQUES =
    /braise|flamb|deglaze|temper|julienne|chiffonade|confit|sous vide|caramelize|fold|blanch|bloom|clarif|emulsif|ferment|reduce|roast|sear|debone|fillet/i;
  let score = 0;
  score += Math.min(ingredients.length * 0.5, 5);
  score += Math.min(steps.length * 0.6, 5);
  if (cookingTime > 60) score += 2;
  else if (cookingTime > 30) score += 1;
  const hardTechCount = steps.filter((s) =>
    HARD_TECHNIQUES.test(s.instruction || ""),
  ).length;
  score += hardTechCount * 1.5;
  if (score <= 3) return "easy";
  if (score >= 7) return "hard";
  return "medium";
}

function transformMeal(meal) {
  const category = meal.strCategory || "Miscellaneous";
  const ingredients = parseIngredients(meal);
  const steps = parseSteps(meal.strInstructions);
  const cookTime = COOKING_TIMES[category] || 30;
  const difficulty = estimateDifficulty(ingredients, steps, cookTime);
  const description =
    (meal.strInstructions || "").replace(/\r?\n/g, " ").trim().slice(0, 220) +
    "...";

  const extraTags = (meal.strTags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    mealdbId: meal.idMeal,
    title: meal.strMeal,
    description,
    cuisine:
      meal.strArea && meal.strArea !== "Unknown" ? meal.strArea : category,
    imageUrl: meal.strMealThumb,
    difficulty,
    cookingTime: COOKING_TIMES[category] || 30,
    prepTime: 15,
    servings: 4,
    ingredients,
    steps,
    tags: [category, meal.strArea, ...extraTags].filter(Boolean),
    nutritionInfo: NUTRITION_EST[category] || NUTRITION_EST.default,
  };
}

async function fetchCategoryIds(category, limit = 8) {
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.meals || []).slice(0, limit).map((m) => m.idMeal);
}

async function fetchMealById(id) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.meals?.[0] || null;
}

async function searchMeals(query) {
  // Try exact query first
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  const exactResults = (data.meals || []).map(transformMeal);
  if (exactResults.length >= 4) return exactResults;

  // Split into words and search each term for broader results
  const words = query.split(/\s+/).filter((w) => w.length >= 3);
  const seen = new Set(exactResults.map((r) => r.mealdbId));
  const extra = [];

  for (const word of words.slice(0, 3)) {
    try {
      const wordUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(word)}`;
      const wordRes = await fetch(wordUrl);
      const wordData = await wordRes.json();
      for (const meal of wordData.meals || []) {
        if (!seen.has(meal.idMeal)) {
          seen.add(meal.idMeal);
          extra.push(transformMeal(meal));
        }
      }
    } catch {}
  }

  // Also try first-letter search for single short queries
  if (exactResults.length === 0 && query.trim().length >= 1) {
    try {
      const letterUrl = `https://www.themealdb.com/api/json/v1/1/search.php?f=${encodeURIComponent(query[0].toLowerCase())}`;
      const letterRes = await fetch(letterUrl);
      const letterData = await letterRes.json();
      const queryLower = query.toLowerCase();
      for (const meal of letterData.meals || []) {
        if (!seen.has(meal.idMeal)) {
          const titleLower = (meal.strMeal || "").toLowerCase();
          const ingredientText = Array.from({ length: 20 }, (_, i) =>
            (meal[`strIngredient${i + 1}`] || "").toLowerCase(),
          ).join(" ");
          if (
            titleLower.includes(queryLower) ||
            ingredientText.includes(queryLower)
          ) {
            seen.add(meal.idMeal);
            extra.push(transformMeal(meal));
          }
        }
      }
    } catch {}
  }

  return [...exactResults, ...extra].slice(0, 20);
}

async function getMealFromAPI(mealdbId) {
  const meal = await fetchMealById(mealdbId);
  if (!meal) return null;
  return transformMeal(meal);
}

module.exports = {
  CATEGORIES,
  fetchCategoryIds,
  fetchMealById,
  transformMeal,
  searchMeals,
  getMealFromAPI,
};
