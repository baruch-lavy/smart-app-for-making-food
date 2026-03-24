const User = require('../models/User');
const Recipe = require('../models/Recipe');
const MealHistory = require('../models/MealHistory');
const Pantry = require('../models/Pantry');

const MAX_MAIN_RESULTS = 6;

async function suggestRecipes({ userId, intent, availableIngredients, maxTime, difficulty, mainIngredient, childrenMode }) {
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

const calculateTimeBasedScore = (currentHour, recipe) => {
  const totalTimeInMinutes = (recipe.cookingTime || 0) + (recipe.prepTime || 0);
  
  if (currentHour >= 7 && currentHour <= 9) {
    return totalTimeInMinutes <= 15 ? 15 : totalTimeInMinutes <= 30 ? 10 : 0;
  }
  
  if (currentHour >= 12 && currentHour <= 14) {
    return totalTimeInMinutes <= 30 ? 12 : totalTimeInMinutes <= 45 ? 8 : 0;
  }
  
  if (currentHour >= 18 && currentHour <= 21) {
    return totalTimeInMinutes <= 60 ? 10 : 5;
  }
  
  return 0;
};

const calculateEnergyLevelMatch = (userEnergyLevel, recipeEnergyRequired) => {
  const energyMatchMap = {
    low: { low: 20, medium: 5, high: -10 },
    medium: { low: 10, medium: 15, high: 8 },
    high: { low: 5, medium: 10, high: 18 }
  };
  
  return energyMatchMap[userEnergyLevel]?.[recipeEnergyRequired] || 0;
};

const getWeatherScore = (recipe) => {
  const currentMonth = new Date().getMonth();
  const isWinter = currentMonth >= 11 || currentMonth <= 2;
  const isSummer = currentMonth >= 5 && currentMonth <= 8;
  
  const weatherTags = recipe.weather || [];
  
  if (isWinter && weatherTags.includes('cold')) return 10;
  if (isSummer && weatherTags.includes('hot')) return 10;
  
  return 0;
};

const calculateLeftoverOptimization = (pantry, recipe) => {
  const pantryItemsExpiringSoon = pantry?.items?.filter(item => {
    if (!item.expiresAt) return false;
    const daysUntilExpiry = Math.floor((new Date(item.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  }) || [];
  
  const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
  const expiringIngredients = pantryItemsExpiringSoon.map(p => p.name.toLowerCase());
  
  const matchCount = recipeIngredients.filter(ri => 
    expiringIngredients.some(ei => ri.includes(ei) || ei.includes(ri))
  ).length;
  
  return matchCount * 15;
};

const calculateNutritionBalance = (recentMeals, recipe) => {
  if (!recentMeals || recentMeals.length === 0) return 0;
  
  const recentCalories = recentMeals.map(m => m.nutritionInfo?.calories || 0);
  const avgRecentCalories = recentCalories.reduce((a, b) => a + b, 0) / recentCalories.length;
  
  const recipeCalories = recipe.nutritionInfo?.calories || 0;
  
  if (avgRecentCalories > 600 && recipeCalories < 500) return 12;
  if (avgRecentCalories < 400 && recipeCalories > 500) return 10;
  
  return 5;
};

const calculateCuisineRotation = (recentHistory, recipe) => {
  const recentCuisines = recentHistory.slice(0, 5).map(h => h.recipeCuisine);
  const cuisineCounts = {};
  
  recentCuisines.forEach(cuisine => {
    cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
  });
  
  const currentCuisine = recipe.cuisine;
  const cuisineCount = cuisineCounts[currentCuisine] || 0;
  
  if (cuisineCount === 0) return 15;
  if (cuisineCount === 1) return 8;
  if (cuisineCount >= 3) return -12;
  
  return 0;
};

async function suggestRecipes({ 
  userId, 
  intent, 
  availableIngredients, 
  maxTime,
  currentContext = {} 
}) {
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

  const pantry = await Pantry.findOne({ userId });
  
  const analytics = await Analytics.findOne({ userId });

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
  if (intent === 'quick') recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
  else if (intent === 'easy') recipes = recipes.filter(r => r.difficulty === 'easy');

  if (maxTime) recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= parseInt(maxTime));

  const userEnergyLevel = preferences.energyLevel || currentContext.energyLevel || 'medium';
  
  if (userEnergyLevel === 'low') {
    recipes = recipes.filter(r => r.energyLevelRequired === 'low' || r.energyLevelRequired === 'medium');
  }

  const currentHour = new Date().getHours();

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

  return scored.slice(0, 5).map(s => ({
    ...s.recipe.toObject(),
    score: s.score,
    missingIngredients: s.missing,
    substitutions: s.substitutions,
    matchPercent: s.matchPercent,
  }));
}

module.exports = { suggestRecipes, getMissingAndSubstitutions, SUBSTITUTIONS };
