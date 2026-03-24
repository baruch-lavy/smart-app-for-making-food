const mongoose = require('mongoose');

const weeklyInsightSchema = new mongoose.Schema({
  weekStartDate: { type: Date, required: true },
  weekEndDate: { type: Date, required: true },
  
  mealsCookedCount: { type: Number, default: 0 },
  newCuisinesTried: [String],
  newRecipesTried: [String],
  
  totalCookingTime: Number,
  averageMealRating: Number,
  
  moneySaved: Number,
  wasteReduced: Number,
  
  mostCookedRecipe: String,
  favoriteCuisine: String,
  
  skillsImproved: [String],
  achievementsUnlocked: [String]
});

const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  overallStats: {
    totalMealsCookedAllTime: { type: Number, default: 0 },
    uniqueRecipesCooked: { type: Number, default: 0 },
    cuisinesExplored: [String],
    favoriteRecipes: [{ recipeId: String, recipeTitle: String, cookedCount: Number }],
    
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    
    totalCookingHours: { type: Number, default: 0 },
    averageSessionDuration: Number
  },
  
  weeklyInsights: [weeklyInsightSchema],
  
  successPredictions: [{
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    recipeTitle: String,
    predictedSuccessRate: { type: Number, min: 0, max: 100 },
    predictedRating: { type: Number, min: 1, max: 5 },
    confidenceLevel: { type: Number, min: 0, max: 100 },
    reasonFactors: [String],
    generatedAt: { type: Date, default: Date.now }
  }],
  
  wasteTracking: {
    totalItemsExpired: { type: Number, default: 0 },
    totalWasteValue: { type: Number, default: 0 },
    wasteReductionRate: Number,
    mostWastedItems: [{ item: String, count: Number, value: Number }]
  },
  
  healthTrends: {
    averageDailyCalories: Number,
    averageDailyProtein: Number,
    averageDailyCarbs: Number,
    averageDailyFat: Number,
    
    weeklyCalorieHistory: [{
      weekStart: Date,
      avgCalories: Number
    }],
    
    nutritionBalance: {
      proteinPercent: Number,
      carbsPercent: Number,
      fatPercent: Number
    }
  },
  
  cookingHeatmaps: {
    mostActiveDays: [String],
    mostActiveHours: [Number],
    peakCookingTime: String,
    
    successRateByDay: [{
      day: String,
      successRate: Number
    }],
    successRateByTime: [{
      hour: Number,
      successRate: Number
    }]
  },
  
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
