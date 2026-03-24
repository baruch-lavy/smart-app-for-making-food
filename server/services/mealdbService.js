const CATEGORIES = ['Chicken', 'Beef', 'Vegetarian', 'Pasta', 'Seafood', 'Lamb', 'Dessert', 'Side'];

const COOKING_TIMES = {
  Chicken: 35, Beef: 50, Vegetarian: 25, Pasta: 20,
  Seafood: 20, Lamb: 60, Dessert: 35, Side: 20,
};

const NUTRITION_EST = {
  Chicken:    { calories: 380, protein: 35, carbs: 20, fat: 12 },
  Beef:       { calories: 480, protein: 38, carbs: 18, fat: 22 },
  Vegetarian: { calories: 280, protein: 12, carbs: 40, fat: 8  },
  Pasta:      { calories: 420, protein: 18, carbs: 58, fat: 10 },
  Seafood:    { calories: 320, protein: 32, carbs: 15, fat: 10 },
  Lamb:       { calories: 450, protein: 36, carbs: 12, fat: 24 },
  Dessert:    { calories: 380, protein: 6,  carbs: 52, fat: 15 },
  Side:       { calories: 180, protein: 8,  carbs: 30, fat: 6  },
  default:    { calories: 350, protein: 20, carbs: 35, fat: 12 },
};

function parseIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] || '').trim();
    const measure = (meal[`strMeasure${i}`] || '').trim();
    if (name) {
      const parts = measure.split(' ');
      const amount = parts[0] || '';
      const unit = parts.slice(1).join(' ') || '';
      ingredients.push({ name, amount, unit });
    }
  }
  return ingredients;
}

function parseSteps(instructions) {
  if (!instructions) return [];
  const lines = instructions
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const steps = lines.map((instruction, i) => ({
    order: i + 1,
    instruction: instruction
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^STEP\s+\d+[\.:]\s*/i, '')
      .trim(),
    tip: '',
    whyItMatters: '',
  })).filter(s => s.instruction.length > 0);

  return steps.length > 0
    ? steps
    : [{ order: 1, instruction: instructions.slice(0, 500), tip: '', whyItMatters: '' }];
}

function estimateDifficulty(ingredients, steps) {
  if (ingredients.length <= 6 && steps.length <= 4) return 'easy';
  if (ingredients.length >= 12 || steps.length >= 8) return 'hard';
  return 'medium';
}

function transformMeal(meal) {
  const category = meal.strCategory || 'Miscellaneous';
  const ingredients = parseIngredients(meal);
  const steps = parseSteps(meal.strInstructions);
  const difficulty = estimateDifficulty(ingredients, steps);
  const description = (meal.strInstructions || '')
    .replace(/\r?\n/g, ' ')
    .trim()
    .slice(0, 220) + '...';

  const extraTags = (meal.strTags || '').split(',').map(t => t.trim()).filter(Boolean);

  return {
    mealdbId: meal.idMeal,
    title: meal.strMeal,
    description,
    cuisine: (meal.strArea && meal.strArea !== 'Unknown') ? meal.strArea : category,
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
  return (data.meals || []).slice(0, limit).map(m => m.idMeal);
}

async function fetchMealById(id) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.meals?.[0] || null;
}

async function searchMeals(query) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.meals || []).map(transformMeal);
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
