const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema({
  original: String,
  alternatives: [{ name: String, ratio: String, notes: String }]
});

const stepSchema = new mongoose.Schema({
  order: Number,
  instruction: String,
  tip: String,
  whyItMatters: String,
  
  techniqueRequired: String,
  difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  estimatedTime: Number,
  
  visualAids: [{
    type: { type: String, enum: ['image', 'video', 'gif'] },
    url: String,
    caption: String
  }],
  
  commonMistakes: [String],
  proTips: [String],
  
  parallelTasks: [String],
  
  timerNeeded: { type: Boolean, default: false },
  timerDuration: Number,
  timerLabel: String,
  
  checkpoints: [String],
  sensoryIndicators: {
    visual: String,
    sound: String,
    smell: String,
    texture: String
  }
});

const recipeSchema = new mongoose.Schema({
  mealdbId: { type: String, unique: true, sparse: true },
  spoonacularId: { type: String, unique: true, sparse: true },
  title: String,
  description: String,
  cuisine: String,
  imageUrl: String,
  sourceUrl: String,
  sourceName: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  cookingTime: Number,
  prepTime: Number,
  servings: Number,
  
  ingredients: [{
    name: String,
    amount: String,
    unit: String,
    optional: { type: Boolean, default: false },
    substitutions: [{ name: String, ratio: String }]
  }],
  
  steps: [stepSchema],
  
  tags: [String],
  
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  source: {
    title: String,
    url: String,
    siteName: String,
  }
});
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  
  dietaryInfo: {
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    isDairyFree: { type: Boolean, default: false },
    isNutFree: { type: Boolean, default: false },
    isKeto: { type: Boolean, default: false },
    isPaleo: { type: Boolean, default: false }
  },
  
  costEstimate: {
    low: Number,
    high: Number,
    currency: { type: String, default: 'USD' }
  },
  
  substitutionGuide: [substitutionSchema],
  
  bestFor: [{ type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'meal-prep', 'date-night', 'kids', 'party'] }],
  season: [{ type: String, enum: ['spring', 'summer', 'fall', 'winter', 'all-season'] }],
  weather: [{ type: String, enum: ['hot', 'cold', 'rainy', 'any'] }],
  
  energyLevelRequired: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  equipment: [String],
  
  leftoverFriendly: { type: Boolean, default: false },
  leftoverStorage: String,
  leftoverDuration: Number,
  
  communityRatings: {
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }
  },
  
  imageUrl: String,
  videoUrl: String,
  
  createdBy: { type: String, default: 'system' },
  isUserGenerated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
