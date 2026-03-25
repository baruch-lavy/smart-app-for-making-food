const Analytics = require('../models/Analytics');
const MealHistory = require('../models/MealHistory');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

const predictRecipeSuccess = async (userId, recipeId) => {
  const user = await User.findById(userId);
  const recipe = await Recipe.findById(recipeId);
  const mealHistory = await MealHistory.find({ userId }).sort({ cookedAt: -1 }).limit(20);
  
  let successRate = 50;
  const reasonFactors = [];
  
  const userCookingLevel = user.cookingLevel || 'beginner';
  const recipeDifficulty = recipe.difficulty || 'easy';
  
  if (userCookingLevel === 'advanced' && recipeDifficulty === 'easy') {
    successRate += 30;
    reasonFactors.push('Your skill level exceeds recipe difficulty');
  } else if (userCookingLevel === 'beginner' && recipeDifficulty === 'hard') {
    successRate -= 20;
    reasonFactors.push('Recipe difficulty above your current level');
  } else if (userCookingLevel === recipeDifficulty) {
    successRate += 15;
    reasonFactors.push('Perfect difficulty match for your level');
  }
  
  const similarRecipes = mealHistory.filter(h => h.recipeCuisine === recipe.cuisine);
  if (similarRecipes.length > 0) {
    const avgRating = similarRecipes.reduce((sum, h) => sum + (h.rating || 3), 0) / similarRecipes.length;
    if (avgRating >= 4) {
      successRate += 20;
      reasonFactors.push('You love this cuisine');
    } else if (avgRating < 3) {
      successRate -= 10;
      reasonFactors.push('Mixed results with this cuisine');
    }
  }
  
  const tastePreferences = user.tastePreferences || [];
  const recipeTags = recipe.tags || [];
  const matchingTags = tastePreferences.filter(pref => 
    recipeTags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
  );
  if (matchingTags.length > 0) {
    successRate += 10 * matchingTags.length;
    reasonFactors.push('Matches your taste preferences');
  }
  
  const totalTime = (recipe.cookingTime || 0) + (recipe.prepTime || 0);
  const typicalTime = user.preferences?.typicalCookingTime || 'moderate';
  if (typicalTime === 'quick' && totalTime <= 30) {
    successRate += 10;
    reasonFactors.push('Fits your time preference');
  } else if (typicalTime === 'relaxed' && totalTime >= 45) {
    successRate += 10;
    reasonFactors.push('Enough time to enjoy cooking');
  }
  
  successRate = Math.max(10, Math.min(95, successRate));
  
  const predictedRating = Math.min(5, Math.max(1, 3 + (successRate - 50) / 20));
  
  return {
    recipeId,
    recipeTitle: recipe.title,
    predictedSuccessRate: Math.round(successRate),
    predictedRating: Math.round(predictedRating * 10) / 10,
    confidenceLevel: 75,
    reasonFactors
  };
};

const generateWeeklyInsight = async (userId, weekStartDate) => {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  
  const weekMeals = await MealHistory.find({
    userId,
    cookedAt: { $gte: weekStartDate, $lte: weekEndDate }
  }).populate('recipeId');
  
  const mealsCookedCount = weekMeals.length;
  
  const cuisines = [...new Set(weekMeals.map(m => m.recipeId?.cuisine).filter(Boolean))];
  const newCuisinesTried = cuisines;
  
  const totalCookingTime = weekMeals.reduce((sum, m) => 
    sum + (m.actualCookingTime || 0) + (m.actualPrepTime || 0), 0
  );
  
  const ratingsArray = weekMeals.map(m => m.rating).filter(Boolean);
  const averageMealRating = ratingsArray.length > 0 
    ? ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length 
    : 0;
  
  const cuisineCount = {};
  weekMeals.forEach(m => {
    const cuisine = m.recipeId?.cuisine;
    if (cuisine) cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
  });
  
  const favoriteCuisine = Object.keys(cuisineCount).sort((a, b) => 
    cuisineCount[b] - cuisineCount[a]
  )[0] || null;
  
  return {
    weekStartDate,
    weekEndDate,
    mealsCookedCount,
    newCuisinesTried,
    totalCookingTime,
    averageMealRating: Math.round(averageMealRating * 10) / 10,
    moneySaved: mealsCookedCount * 12,
    wasteReduced: 0,
    favoriteCuisine,
    skillsImproved: [],
    achievementsUnlocked: []
  };
};

const updateAnalytics = async (userId) => {
  let analytics = await Analytics.findOne({ userId });
  
  if (!analytics) {
    analytics = new Analytics({ 
      userId,
      overallStats: {}
    });
  }
  
  const allMeals = await MealHistory.find({ userId });
  
  analytics.overallStats.totalMealsCookedAllTime = allMeals.length;
  
  const uniqueRecipeIds = [...new Set(allMeals.map(m => m.recipeId?.toString()).filter(Boolean))];
  analytics.overallStats.uniqueRecipesCooked = uniqueRecipeIds.length;
  
  const recipes = await Recipe.find({ _id: { $in: uniqueRecipeIds } });
  const cuisines = [...new Set(recipes.map(r => r.cuisine).filter(Boolean))];
  analytics.overallStats.cuisinesExplored = cuisines;
  
  const totalMinutes = allMeals.reduce((sum, m) => 
    sum + (m.actualCookingTime || 0) + (m.actualPrepTime || 0), 0
  );
  analytics.overallStats.totalCookingHours = Math.round(totalMinutes / 60 * 10) / 10;
  
  analytics.lastUpdated = new Date();
  
  await analytics.save();
  return analytics;
};

// ⭐ Track user event
const trackEvent = async (userId, type, metadata = {}) => {
  return Analytics.create({
    userId,
    type,
    metadata,
    createdAt: new Date()
  });
};

// ⭐ Save recipe feedback
const saveRecipeFeedback = async ({
  userId,
  recipeId,
  rating,
  liked,
  difficultyFelt
}) => {
  await trackEvent(userId, liked ? "recipe_like" : "recipe_dislike", {
    recipeId,
    rating,
    difficultyFelt
  });

  return {
    success: true
  };
};

// ⭐ Build simple preference signals
const getPreferenceSignals = async (userId) => {
  const history = await MealHistory.find({ userId });

  const likedMeals = history.filter(m => m.rating >= 4);
  const dislikedMeals = history.filter(m => m.rating <= 2);

  return {
    likedRecipes: likedMeals.map(m => m.recipeId),
    dislikedRecipes: dislikedMeals.map(m => m.recipeId),
    averageRating:
      history.length > 0
        ? history.reduce((s, m) => s + (m.rating || 3), 0) / history.length
        : null
  };
};
module.exports = {
  predictRecipeSuccess,
  generateWeeklyInsight,
  updateAnalytics,
  trackEvent,
  saveRecipeFeedback,
  getPreferenceSignals
};