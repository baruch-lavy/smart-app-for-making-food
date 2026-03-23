const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  cuisine: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  cookingTime: Number,
  prepTime: Number,
  servings: Number,
  ingredients: [{
    name: String,
    amount: String,
    unit: String
  }],
  steps: [{
    order: Number,
    instruction: String,
    tip: String,
    whyItMatters: String
  }],
  tags: [String],
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
});

module.exports = mongoose.model('Recipe', recipeSchema);
