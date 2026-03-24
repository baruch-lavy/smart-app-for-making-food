const User = require('../models/User');
const Recipe = require('../models/Recipe');
const MealHistory = require('../models/MealHistory');

const MAX_MAIN_RESULTS = 6;

async function suggestRecipes({ userId, intent, availableIngredients, maxTime, difficulty, mainIngredient, childrenMode }) {
  const user = await User.findById(userId);
  const { tastePreferences = [], dislikes = [], dietaryRestrictions = [] } = user || {};

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentHistory = await MealHistory.find({ userId, cookedAt: { $gte: sevenDaysAgo } });
  const recentRecipeIds = recentHistory.map(h => h.recipeId?.toString());

  let recipes = await Recipe.find({});

  if (availableIngredients && availableIngredients.length > 0) {
    const available = availableIngredients.map(i => i.toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      const matches = recipeIngredients.filter(ri => available.some(ai => ri.includes(ai) || ai.includes(ri)));
      return matches.length / recipeIngredients.length >= 0.5;
    });
  }

  // support new intent object: { time: 'short'|'medium'|'long', difficulty: 'easy'|'medium'|'hard' }
  if (typeof intent === 'string') {
    if (intent === 'quick') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
    if (intent === 'easy') recipes = recipes.filter(r => r.difficulty === 'easy');
  } else if (intent && typeof intent === 'object') {
    if (intent.time === 'short') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
    else if (intent.time === 'medium') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 45);
    else if (intent.time === 'long') {
      // no time filter for long
    }
    if (intent.difficulty) recipes = recipes.filter(r => r.difficulty === intent.difficulty);
  }

  // also apply explicit difficulty parameter if provided from client
  if (difficulty) recipes = recipes.filter(r => r.difficulty === difficulty);

  // If childrenMode is requested, prefer easy recipes and optionally filter out hard ones
  if (childrenMode) {
    // prefer easy: keep all but apply later boost; optionally remove 'hard' recipes
    recipes = recipes.filter(r => r.difficulty !== 'hard');
  }

  if (maxTime) {
    recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= parseInt(maxTime));
  }

  const scored = recipes.map(recipe => {
    let score = 0;
    const tags = recipe.tags || [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());

    if (tastePreferences.some(pref => tags.some(t => t.toLowerCase().includes(pref.toLowerCase())))) {
      score += 20;
    }

    if (dislikes.some(dislike => ingredients.some(ing => ing.includes(dislike.toLowerCase())))) {
      score -= 40;
    }

    if (!recentRecipeIds.includes(recipe._id.toString())) {
      score += 15;
    }

    if (availableIngredients && availableIngredients.length > 0) {
      const available = availableIngredients.map(i => i.toLowerCase());
      const matchCount = ingredients.filter(ing => available.some(ai => ing.includes(ai) || ai.includes(ing))).length;
      score += matchCount * 10;
    }

    // boost recipes that include the requested main ingredient
    if (mainIngredient) {
      const mi = mainIngredient.toLowerCase();
      if (ingredients.some(ing => ing.includes(mi) || mi.includes(ing))) {
        score += 40; // large boost to prioritize mains with this ingredient
      } else {
        score -= 5; // slight penalty if missing
      }
    }

    // boost kid-friendly recipes when childrenMode is on
    if (childrenMode) {
      // tags that indicate suitability for kids
      const kidTags = ['kid-friendly', 'family', 'kids', 'child-friendly', 'children'];
      if (tags.some(t => kidTags.includes(t.toLowerCase()))) score += 30;
      // also prefer easy difficulty
      if (recipe.difficulty === 'easy') score += 20;
    }

    const restrictedMap = {
      'Vegetarian': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb'],
      'Vegan': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb', 'cheese', 'milk', 'butter', 'egg', 'cream', 'honey'],
      'Gluten-Free': ['flour', 'bread', 'pasta', 'wheat', 'soy sauce', 'barley'],
      'Dairy-Free': ['cheese', 'milk', 'butter', 'cream', 'yogurt'],
      'Nut-Free': ['almond', 'walnut', 'peanut', 'cashew', 'pecan', 'nut'],
    };
    for (const restriction of dietaryRestrictions) {
      const restricted = restrictedMap[restriction] || [];
      if (restricted.some(r => ingredients.some(ing => ing.includes(r)))) {
        score -= 10;
      }
    }

    return { recipe, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMains = scored.slice(0, MAX_MAIN_RESULTS).map(s => s.recipe);

  // find a side suggestion: prefer a different recipe with same cuisine and short time
  let side = null;
  if (topMains.length > 0) {
    const mainCuisine = topMains[0].cuisine;
    // candidates: recipes not in top mains, same cuisine, total time <= 30
    const mainIds = new Set(topMains.map(r => r._id.toString()));
    const sideCandidates = (await Recipe.find({ cuisine: mainCuisine })).filter(r => !mainIds.has(r._id.toString()) && (r.cookingTime + r.prepTime) <= 30);
    if (sideCandidates.length > 0) {
      // pick the one with shortest total time
      sideCandidates.sort((a, b) => (a.cookingTime + a.prepTime) - (b.cookingTime + b.prepTime));
      side = sideCandidates[0];
    }
  }

  return { mains: topMains, side };
}

module.exports = { suggestRecipes };
