const mongoose = require('mongoose');

const mealHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  recipeTitle: String,
  cookedAt: { type: Date, default: Date.now },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, enum: ['loved', 'ok', 'disliked'], default: 'ok' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('MealHistory', mealHistorySchema);
