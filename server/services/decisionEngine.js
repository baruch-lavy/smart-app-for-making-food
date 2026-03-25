const User = require('../models/User');
const Recipe = require('../models/Recipe');
const MealHistory = require('../models/MealHistory');
const Pantry = require('../models/Pantry');

const SUBSTITUTIONS = {
  'egg': ['flax egg', 'chia egg', 'applesauce', 'banana'],
  'butter': ['olive oil', 'coconut oil', 'margarine', 'vegetable oil'],
  'milk': ['almond milk', 'oat milk', 'soy milk', 'coconut milk'],
  'flour': ['almond flour', 'oat flour', 'rice flour', 'cornstarch'],
  'sour cream': ['greek yogurt', 'yogurt'],
  'heavy cream': ['coconut cream', 'evaporated milk'],
  'breadcrumbs': ['oats', 'crackers', 'cornmeal'],
  'lemon juice': ['lime juice', 'white vinegar', 'apple cider vinegar'],
  'chicken broth': ['vegetable broth', 'water'],
  'beef broth': ['vegetable broth', 'mushroom broth'],
  'honey': ['maple syrup', 'agave', 'sugar'],
  'soy sauce': ['tamari', 'coconut aminos'],
  'parmesan': ['pecorino', 'grana padano', 'nutritional yeast'],
  'tomato paste': ['tomato sauce', 'ketchup'],
  'wine': ['grape juice', 'broth', 'water'],
};

const HARD_EXCLUSION_MAP = {
  'Vegetarian': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb', 'turkey', 'veal'],
  'Vegan': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb', 'turkey', 'veal', 'cheese', 'milk', 'butter', 'egg', 'cream', 'honey', 'whey', 'gelatin'],
  'Gluten-Free': ['flour', 'bread', 'pasta', 'wheat', 'soy sauce', 'barley', 'rye', 'semolina'],
  'Dairy-Free': ['cheese', 'milk', 'butter', 'cream', 'yogurt', 'whey', 'casein'],
  'Nut-Free': ['almond', 'walnut', 'peanut', 'cashew', 'pecan', 'hazelnut', 'pistachio', 'macadamia'],
};

function ingredientMatch(a, b) {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  return al.includes(bl) || bl.includes(al);
}

function getMissingAndSubstitutions(recipe, pantryItems) {
  const pantryNames = pantryItems.map(p => p.name.toLowerCase());
  const missing = [];
  const substitutions = [];
  for (const ing of recipe.ingredients) {
    const ingName = ing.name.toLowerCase();
    const inPantry = pantryNames.some(p => ingredientMatch(p, ingName));
    if (!inPantry) {
      const subKey = Object.keys(SUBSTITUTIONS).find(k => ingredientMatch(ingName, k));
      const subList = subKey ? SUBSTITUTIONS[subKey] : [];
      const availableSub = subList.find(sub => pantryNames.some(p => ingredientMatch(p, sub)));
      if (availableSub) substitutions.push({ ingredient: ing.name, substitute: availableSub });
      else missing.push({ name: ing.name, amount: ing.amount, unit: ing.unit });
    }
  }
  return { missing, substitutions };
}

async function suggestRecipes({ userId, intent, availableIngredients, maxTime, difficulty, mainIngredient, childrenMode }) {
  const user = await User.findById(userId);
  const {
    tastePreferences = [],
    dislikes = [],
    dietaryRestrictions = [],
    cookingLevel = 'beginner',
  } = user || {};

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const recentHistory = await MealHistory.find({ userId, cookedAt: { $gte: sevenDaysAgo } });
  const cookedLast7Days = new Set(recentHistory.map(h => h.recipeId?.toString()));
  const cookedLast3Days = new Set(recentHistory.filter(h => h.cookedAt >= threeDaysAgo).map(h => h.recipeId?.toString()));

  const ratingMap = {};
  for (const h of recentHistory) {
    const id = h.recipeId?.toString();
    if (!id) continue;
    if (!ratingMap[id] || h.cookedAt > ratingMap[id].cookedAt) ratingMap[id] = h;
  }

  const allHistory = await MealHistory.find({ userId });
  const allRatingMap = {};
  for (const h of allHistory) {
    const id = h.recipeId?.toString();
    if (!id) continue;
    if (!allRatingMap[id] || h.cookedAt > allRatingMap[id].cookedAt) allRatingMap[id] = h;
  }

  const pantryDoc = await Pantry.findOne({ userId });
  const pantryItems = pantryDoc?.items || [];
  const now = new Date();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  let recipes = await Recipe.find({});

  // Hard dietary exclusion
  if (dietaryRestrictions.length > 0) {
    recipes = recipes.filter(recipe => {
      const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
      for (const restriction of dietaryRestrictions) {
        const excluded = HARD_EXCLUSION_MAP[restriction] || [];
        if (excluded.some(ex => ingredients.some(ing => ing.includes(ex)))) return false;
      }
      return true;
    });
  }

  // Filter by available ingredients (>= 30% match)
  if (availableIngredients && availableIngredients.length > 0) {
    const available = availableIngredients.map(i => i.toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeIngs = recipe.ingredients.map(i => i.name.toLowerCase());
      const matches = recipeIngs.filter(ri => {
        if (available.some(ai => ingredientMatch(ri, ai))) return true;
        const subKey = Object.keys(SUBSTITUTIONS).find(k => ingredientMatch(ri, k));
        if (subKey) return SUBSTITUTIONS[subKey].some(sub => available.some(ai => ingredientMatch(ai, sub)));
        return false;
      });
      return recipeIngs.length === 0 || matches.length / recipeIngs.length >= 0.3;
    });
  }

  // Intent filter
  if (typeof intent === 'string') {
    if (intent === 'quick') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
    if (intent === 'easy') recipes = recipes.filter(r => r.difficulty === 'easy');
  } else if (intent && typeof intent === 'object') {
    if (intent.time === 'short') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
    else if (intent.time === 'medium') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 45);
    if (intent.difficulty) recipes = recipes.filter(r => r.difficulty === intent.difficulty);
  }

  if (difficulty) recipes = recipes.filter(r => r.difficulty === difficulty);
  if (maxTime) recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= parseInt(maxTime));
  if (childrenMode) recipes = recipes.filter(r => r.difficulty !== 'hard');

  // Score recipes
  const scored = recipes.map(recipe => {
    let score = 0;
    const recipeId = recipe._id.toString();
    const tags = recipe.tags || [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());

    if (tastePreferences.some(pref => tags.some(t => t.toLowerCase().includes(pref.toLowerCase())))) score += 20;
    if (dislikes.some(dislike => ingredients.some(ing => ing.includes(dislike.toLowerCase())))) score -= 40;

    if (cookedLast3Days.has(recipeId)) score -= 30;
    else if (cookedLast7Days.has(recipeId)) score -= 15;
    else score += 15;

    const histEntry = allRatingMap[recipeId];
    if (histEntry) {
      if (histEntry.feedback === 'loved') score += 30;
      else if (histEntry.feedback === 'disliked') score -= 50;
    }

    if (recipe.difficulty === 'hard') {
      if (cookingLevel === 'beginner') score -= 20;
      else if (cookingLevel === 'advanced') score += 10;
    } else if (recipe.difficulty === 'easy' && cookingLevel === 'beginner') {
      score += 10;
    }

    if (availableIngredients && availableIngredients.length > 0) {
      const available = availableIngredients.map(i => i.toLowerCase());
      const matchCount = ingredients.filter(ing => available.some(ai => ingredientMatch(ing, ai))).length;
      score += matchCount * 8;
    }

    if (mainIngredient) {
      const mi = mainIngredient.toLowerCase();
      if (ingredients.some(ing => ing.includes(mi) || mi.includes(ing))) score += 40;
      else score -= 5;
    }

    if (childrenMode) {
      const kidTags = ['kid-friendly', 'family', 'kids', 'child-friendly', 'children'];
      if (tags.some(t => kidTags.includes(t.toLowerCase()))) score += 30;
      if (recipe.difficulty === 'easy') score += 20;
    }

    // Expiry-aware bonus
    const expiringItems = pantryItems
      .filter(p => p.expiresAt && p.expiresAt >= now && p.expiresAt <= threeDaysFromNow)
      .map(p => p.name.toLowerCase());
    if (expiringItems.length > 0) {
      const expiryMatches = ingredients.filter(ing => expiringItems.some(e => ingredientMatch(ing, e))).length;
      score += expiryMatches * 15;
    }

    const { missing, substitutions } = getMissingAndSubstitutions(recipe, pantryItems);
    const matchPercent = recipe.ingredients.length > 0
      ? Math.round(((recipe.ingredients.length - missing.length) / recipe.ingredients.length) * 100)
      : 100;

    return { recipe, score, missing, substitutions, matchPercent };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMains = scored.slice(0, 6).map(s => ({
    ...s.recipe.toObject(),
    score: s.score,
    missingIngredients: s.missing,
    substitutions: s.substitutions,
    matchPercent: s.matchPercent,
  }));

  // Side dish
  let side = null;
  if (topMains.length > 0) {
    const mainCuisine = topMains[0].cuisine;
    const mainIds = new Set(topMains.map(r => r._id?.toString()));
    const sideCandidates = (await Recipe.find({ cuisine: mainCuisine }))
      .filter(r => !mainIds.has(r._id.toString()) && (r.cookingTime + r.prepTime) <= 30);
    if (sideCandidates.length > 0) {
      sideCandidates.sort((a, b) => (a.cookingTime + a.prepTime) - (b.cookingTime + b.prepTime));
      side = sideCandidates[0];
    }
  }

  return { mains: topMains, side };
}

async function calculateMissingIngredients(recipeId, userId) {
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) return { missing: [], substitutions: [] };
  const pantryDoc = await Pantry.findOne({ userId });
  const pantryItems = pantryDoc?.items || [];
  return getMissingAndSubstitutions(recipe, pantryItems);
}

module.exports = { suggestRecipes, calculateMissingIngredients, getMissingAndSubstitutions, SUBSTITUTIONS };
