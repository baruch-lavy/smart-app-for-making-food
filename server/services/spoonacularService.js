/**
 * Spoonacular API service — aggregates recipes from AllRecipes, Food Network,
 * Epicurious, Serious Eats, Tasty, and hundreds more sites.
 *
 * Get a free API key at: https://spoonacular.com/food-api
 * Free tier: 150 requests/day
 *
 * Set SPOONACULAR_API_KEY in server/.env to enable this service.
 * When not set, the app falls back to TheMealDB.
 */

const BASE_URL = 'https://api.spoonacular.com';

function getKey() {
  return process.env.SPOONACULAR_API_KEY || '';
}

function isEnabled() {
  return !!getKey();
}

/** Convert Spoonacular recipe object to our internal Recipe schema shape */
function transformRecipe(r) {
  const ingredients = (r.extendedIngredients || []).map(ing => ({
    name: ing.name || ing.originalName,
    amount: ing.amount != null ? String(ing.amount) : '',
    unit: ing.unit || '',
  }));

  const steps = [];
  (r.analyzedInstructions || []).forEach(block => {
    (block.steps || []).forEach(s => {
      steps.push({
        order: s.number,
        instruction: s.step,
        tip: '',
        whyItMatters: '',
      });
    });
  });
  // Fallback if no analyzed instructions
  if (steps.length === 0 && r.instructions) {
    r.instructions
      .replace(/\r?\n/g, ' ')
      .split(/(?<=\.)\s+/)
      .filter(s => s.length > 10)
      .slice(0, 20)
      .forEach((instruction, i) => steps.push({ order: i + 1, instruction, tip: '', whyItMatters: '' }));
  }

  const difficulty = (() => {
    if (ingredients.length <= 6 && steps.length <= 4) return 'easy';
    if (ingredients.length >= 12 || steps.length >= 8) return 'hard';
    return 'medium';
  })();

  const cuisine = (r.cuisines && r.cuisines[0]) ||
    (r.dishTypes && r.dishTypes[0]) || 'International';

  const nutritionInfo = (() => {
    const n = r.nutrition?.nutrients;
    if (!n) return null;
    const find = name => Math.round(n.find(x => x.name === name)?.amount || 0);
    return {
      calories: find('Calories'),
      protein: find('Protein'),
      carbs: find('Carbohydrates'),
      fat: find('Fat'),
    };
  })();

  const description = r.summary
    ? r.summary.replace(/<[^>]+>/g, '').slice(0, 250) + '...'
    : `A delicious ${cuisine} recipe.`;

  return {
    spoonacularId: String(r.id),
    title: r.title,
    description,
    cuisine,
    imageUrl: r.image || '',
    sourceUrl: r.sourceUrl || '',
    sourceName: r.sourceName || '',
    difficulty,
    cookingTime: r.readyInMinutes || 30,
    prepTime: r.preparationMinutes || Math.floor((r.readyInMinutes || 30) * 0.4),
    servings: r.servings || 4,
    ingredients,
    steps,
    tags: [...(r.dishTypes || []), ...(r.cuisines || []), ...(r.diets || [])],
    nutritionInfo,
  };
}

/**
 * Search for recipes across the internet via Spoonacular.
 * Returns an array of transformed recipe objects (not yet saved to DB).
 */
async function searchRecipes(query, { number = 12, diet, cuisine, maxReadyTime } = {}) {
  const key = getKey();
  if (!key) return null; // signal to caller to fall back

  const params = new URLSearchParams({
    apiKey: key,
    query,
    number,
    addRecipeInformation: 'true',
    fillIngredients: 'true',
    instructionsRequired: 'true',
  });
  if (diet) params.set('diet', diet);
  if (cuisine) params.set('cuisine', cuisine);
  if (maxReadyTime) params.set('maxReadyTime', maxReadyTime);

  const res = await fetch(`${BASE_URL}/recipes/complexSearch?${params}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spoonacular search failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return (data.results || []).map(transformRecipe);
}

/**
 * Fetch full recipe info by Spoonacular ID (includes nutrition).
 */
async function getRecipeById(spoonacularId) {
  const key = getKey();
  if (!key) return null;

  const params = new URLSearchParams({
    apiKey: key,
    includeNutrition: 'true',
  });

  const res = await fetch(`${BASE_URL}/recipes/${spoonacularId}/information?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return transformRecipe(data);
}

module.exports = { isEnabled, searchRecipes, getRecipeById };
