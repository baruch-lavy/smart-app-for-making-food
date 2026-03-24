const User = require('../models/User');
const Recipe = require('../models/Recipe');
const MealHistory = require('../models/MealHistory');
const Pantry = require('../models/Pantry');

// Substitution map: key = ingredient that may be missing, value = list of possible substitutes
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

// Hard dietary exclusion map — if ANY of these are in the recipe, exclude it entirely
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
      // Check if a substitute is in pantry
      const subKey = Object.keys(SUBSTITUTIONS).find(k => ingredientMatch(ingName, k));
      const subList = subKey ? SUBSTITUTIONS[subKey] : [];
      const availableSub = subList.find(sub => pantryNames.some(p => ingredientMatch(p, sub)));
      if (availableSub) {
        substitutions.push({ ingredient: ing.name, substitute: availableSub });
      } else {
        missing.push({ name: ing.name, amount: ing.amount, unit: ing.unit });
      }
    }
  }

  return { missing, substitutions };
}

async function suggestRecipes({ userId, intent, availableIngredients, maxTime }) {
  const user = await User.findById(userId);
  const {
    tastePreferences = [],
    dislikes = [],
    dietaryRestrictions = [],
    cookingLevel = 'beginner',
  } = user || {};

  // Fetch meal history for last 7 days + ratings
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const recentHistory = await MealHistory.find({ userId, cookedAt: { $gte: sevenDaysAgo } });

  const cookedLast7Days = new Set(recentHistory.map(h => h.recipeId?.toString()));
  const cookedLast3Days = new Set(
    recentHistory.filter(h => h.cookedAt >= threeDaysAgo).map(h => h.recipeId?.toString())
  );

  // Build rating map: recipeId -> best feedback
  const ratingMap = {};
  for (const h of recentHistory) {
    const id = h.recipeId?.toString();
    if (!id) continue;
    if (!ratingMap[id] || h.cookedAt > ratingMap[id].cookedAt) ratingMap[id] = h;
  }

  // Fetch all-time history for loved/disliked
  const allHistory = await MealHistory.find({ userId });
  const allRatingMap = {};
  for (const h of allHistory) {
    const id = h.recipeId?.toString();
    if (!id) continue;
    if (!allRatingMap[id] || h.cookedAt > allRatingMap[id].cookedAt) allRatingMap[id] = h;
  }

  // Fetch pantry for expiry-aware scoring and substitutions
  const pantryDoc = await Pantry.findOne({ userId });
  const pantryItems = pantryDoc?.items || [];
  const now = new Date();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  let recipes = await Recipe.find({});

  // Hard dietary exclusion — remove recipes entirely if they contain restricted ingredients
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

  // Filter by available ingredients if provided (need >= 30% match with substitutions counted)
  if (availableIngredients && availableIngredients.length > 0) {
    const available = availableIngredients.map(i => i.toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeIngs = recipe.ingredients.map(i => i.name.toLowerCase());
      const matches = recipeIngs.filter(ri => {
        if (available.some(ai => ingredientMatch(ri, ai))) return true;
        // Count substitution as partial match
        const subKey = Object.keys(SUBSTITUTIONS).find(k => ingredientMatch(ri, k));
        if (subKey) {
          return SUBSTITUTIONS[subKey].some(sub => available.some(ai => ingredientMatch(ai, sub)));
        }
        return false;
      });
      return matches.length / recipeIngs.length >= 0.3;
    });
  }

  if (intent === 'quick') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
  else if (intent === 'easy') recipes = recipes.filter(r => r.difficulty === 'easy');

  if (maxTime) recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= parseInt(maxTime));

  const scored = recipes.map(recipe => {
    let score = 0;
    const recipeId = recipe._id.toString();
    const tags = recipe.tags || [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());

    // Taste preferences match
    if (tastePreferences.some(pref => tags.some(t => t.toLowerCase().includes(pref.toLowerCase())))) {
      score += 20;
    }

    // User's disliked ingredients (soft penalty)
    if (dislikes.some(dislike => ingredients.some(ing => ing.includes(dislike.toLowerCase())))) {
      score -= 40;
    }

    // Smarter anti-repetition: steeper penalty for very recent
    if (cookedLast3Days.has(recipeId)) score -= 30;
    else if (cookedLast7Days.has(recipeId)) score -= 15;
    else score += 15; // bonus for variety

    // User rating history (all-time)
    const histEntry = allRatingMap[recipeId];
    if (histEntry) {
      if (histEntry.feedback === 'loved') score += 30;
      else if (histEntry.feedback === 'disliked') score -= 50;
    }

    // Difficulty adaptation based on cooking level
    if (recipe.difficulty === 'hard') {
      if (cookingLevel === 'beginner') score -= 20;
      else if (cookingLevel === 'advanced') score += 10;
    } else if (recipe.difficulty === 'easy' && cookingLevel === 'beginner') {
      score += 10;
    }

    // Ingredient coverage scoring (with expiry-soon bonus)
    if (availableIngredients && availableIngredients.length > 0) {
      const available = availableIngredients.map(i => i.toLowerCase());
      const matchCount = ingredients.filter(ing => available.some(ai => ingredientMatch(ing, ai))).length;
      score += matchCount * 8;
    }

    // Pantry expiry-aware bonus: boost recipes that use soon-to-expire items
    const expiringItems = pantryItems
      .filter(p => p.expiresAt && p.expiresAt >= now && p.expiresAt <= threeDaysFromNow)
      .map(p => p.name.toLowerCase());

    if (expiringItems.length > 0) {
      const expiryMatches = ingredients.filter(ing => expiringItems.some(e => ingredientMatch(ing, e))).length;
      score += expiryMatches * 15; // strong boost — use expiring ingredients
    }

    // Compute missing ingredients and substitutions for the response
    const { missing, substitutions } = getMissingAndSubstitutions(recipe, pantryItems);

    // Calculate match percent based on pantry
    let matchPercent = null;
    if (pantryItems.length > 0 || (availableIngredients && availableIngredients.length > 0)) {
      const allAvailable = [
        ...pantryItems.map(p => p.name.toLowerCase()),
        ...(availableIngredients || []).map(i => i.toLowerCase()),
      ];
      const matched = ingredients.filter(ing =>
        allAvailable.some(a => ingredientMatch(ing, a)) ||
        substitutions.some(s => s.ingredient.toLowerCase() === ing)
      ).length;
      matchPercent = Math.round((matched / ingredients.length) * 100);
    }

    return { recipe, score, missing, substitutions, matchPercent };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(s => ({
    ...s.recipe.toObject(),
    score: s.score,
    missingIngredients: s.missing,
    substitutions: s.substitutions,
    matchPercent: s.matchPercent,
  }));
}

module.exports = { suggestRecipes, getMissingAndSubstitutions, SUBSTITUTIONS };
