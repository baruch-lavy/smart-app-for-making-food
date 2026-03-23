const User = require('../models/User');
const Recipe = require('../models/Recipe');
const MealHistory = require('../models/MealHistory');
const Pantry = require('../models/Pantry');
const Analytics = require('../models/Analytics');

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
    allergies = [],
    householdMembers = [],
    preferences = {}
  } = user || {};

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentHistory = await MealHistory.find({ 
    userId, 
    cookedAt: { $gte: sevenDaysAgo } 
  }).sort({ cookedAt: -1 });
  
  const recentRecipeIds = recentHistory.map(h => h.recipeId?.toString());

  const pantry = await Pantry.findOne({ userId });
  
  const analytics = await Analytics.findOne({ userId });

  let recipes = await Recipe.find({});

  const allDietaryRestrictions = [...dietaryRestrictions];
  const allAllergies = [...allergies];
  
  householdMembers.forEach(member => {
    if (member.isActive) {
      allDietaryRestrictions.push(...(member.dietaryRestrictions || []));
      allAllergies.push(...(member.allergies || []));
    }
  });

  if (availableIngredients && availableIngredients.length > 0) {
    const available = availableIngredients.map(i => i.toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      const matches = recipeIngredients.filter(ri => 
        available.some(ai => ri.includes(ai) || ai.includes(ri))
      );
      return matches.length / recipeIngredients.length >= 0.5;
    });
  }

  if (intent === 'quick') {
    recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
  } else if (intent === 'easy') {
    recipes = recipes.filter(r => r.difficulty === 'easy');
  } else if (intent === 'effort') {
    recipes = recipes.filter(r => r.difficulty === 'medium' || r.difficulty === 'hard');
  }

  if (maxTime) {
    recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= parseInt(maxTime));
  }

  const userEnergyLevel = preferences.energyLevel || currentContext.energyLevel || 'medium';
  
  if (userEnergyLevel === 'low') {
    recipes = recipes.filter(r => r.energyLevelRequired === 'low' || r.energyLevelRequired === 'medium');
  }

  const currentHour = new Date().getHours();

  const scored = recipes.map(recipe => {
    let score = 0;
    const tags = recipe.tags || [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());

    if (tastePreferences.some(pref => 
      tags.some(t => t.toLowerCase().includes(pref.toLowerCase()))
    )) {
      score += 20;
    }

    if (dislikes.some(dislike => 
      ingredients.some(ing => ing.includes(dislike.toLowerCase()))
    )) {
      score -= 40;
    }

    allAllergies.forEach(allergy => {
      if (ingredients.some(ing => ing.includes(allergy.toLowerCase()))) {
        score -= 100;
      }
    });

    if (!recentRecipeIds.includes(recipe._id.toString())) {
      score += 15;
    }

    if (availableIngredients && availableIngredients.length > 0) {
      const available = availableIngredients.map(i => i.toLowerCase());
      const matchCount = ingredients.filter(ing => 
        available.some(ai => ing.includes(ai) || ai.includes(ing))
      ).length;
      score += matchCount * 10;
    }

    const restrictedMap = {
      'Vegetarian': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb'],
      'Vegan': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb', 'cheese', 'milk', 'butter', 'egg', 'cream', 'honey'],
      'Gluten-Free': ['flour', 'bread', 'pasta', 'wheat', 'soy sauce', 'barley'],
      'Dairy-Free': ['cheese', 'milk', 'butter', 'cream', 'yogurt'],
      'Nut-Free': ['almond', 'walnut', 'peanut', 'cashew', 'pecan', 'nut'],
      'Keto': ['rice', 'pasta', 'bread', 'potato', 'sugar'],
      'Paleo': ['dairy', 'grains', 'legumes', 'processed']
    };
    
    for (const restriction of allDietaryRestrictions) {
      const restricted = restrictedMap[restriction] || [];
      if (restricted.some(r => ingredients.some(ing => ing.includes(r)))) {
        score -= 50;
      }
    }

    score += calculateTimeBasedScore(currentHour, recipe);

    score += calculateEnergyLevelMatch(userEnergyLevel, recipe.energyLevelRequired || 'medium');

    score += getWeatherScore(recipe);

    score += calculateLeftoverOptimization(pantry, recipe);

    score += calculateNutritionBalance(
      recentHistory.map(h => ({ nutritionInfo: h.nutritionInfo })),
      recipe
    );

    score += calculateCuisineRotation(recentHistory, recipe);

    if (recipe.leftoverFriendly && currentContext.needsMealPrep) {
      score += 12;
    }

    if (analytics?.successPredictions) {
      const prediction = analytics.successPredictions.find(
        p => p.recipeId?.toString() === recipe._id.toString()
      );
      if (prediction) {
        score += (prediction.predictedSuccessRate / 100) * 10;
      }
    }

    return { recipe, score };
  });

  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, 5).map(s => ({ 
    recipe: s.recipe, 
    matchScore: Math.round(s.score),
    reasons: [] 
  }));
}

async function calculateMissingIngredients(recipeId, userId) {
  const recipe = await Recipe.findById(recipeId);
  const pantry = await Pantry.findOne({ userId });
  
  if (!recipe) return { missing: [], have: [] };
  
  const pantryItems = pantry?.items?.map(item => item.name.toLowerCase()) || [];
  const recipeIngredients = recipe.ingredients;
  
  const missingIngredients = [];
  const haveIngredients = [];
  
  recipeIngredients.forEach(ingredient => {
    const ingredientNameLower = ingredient.name.toLowerCase();
    const isInPantryExactly = pantryItems.some(p => p === ingredientNameLower);
    const isInPantryPartially = pantryItems.some(p => 
      p.includes(ingredientNameLower) || ingredientNameLower.includes(p)
    );
    
    if (isInPantryExactly || isInPantryPartially) {
      haveIngredients.push(ingredient);
    } else {
      missingIngredients.push(ingredient);
    }
  });
  
  return {
    missing: missingIngredients,
    have: haveIngredients,
    substitutions: recipe.substitutionGuide || []
  };
}

module.exports = { suggestRecipes, calculateMissingIngredients };
