const mongoose = require('mongoose');

const cookingSessionSchema = new mongoose.Schema({
  startedAt: Date,
  completedAt: Date,
  stepsCompleted: [Number],
  currentStep: Number,
  mistakesMade: [String],
  notesAdded: [String],
  wasSuccessful: { type: Boolean, default: true }
});

const mealHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  recipeTitle: String,
  cookedAt: { type: Date, default: Date.now },
  
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, enum: ['loved', 'ok', 'disliked'], default: 'ok' },
  notes: String,
  
  cookingSession: cookingSessionSchema,
  
  tasteRating: { type: Number, min: 1, max: 5 },
  difficultyExperienced: { type: String, enum: ['easier-than-expected', 'as-expected', 'harder-than-expected'] },
  wouldCookAgain: { type: Boolean, default: true },
  
  leftoverAmount: { type: String, enum: ['none', 'little', 'moderate', 'lots'] },
  leftoverUsed: { type: Boolean, default: false },
  
  actualCookingTime: Number,
  actualPrepTime: Number,
  
  photosUploaded: [String],
  
  cookedFor: [{
    householdMemberId: String,
    liked: Boolean,
    notes: String
  }],
  
  techniquesPracticed: [String],
  
  contextTags: [{ type: String, enum: ['weekday-dinner', 'weekend-special', 'meal-prep', 'date-night', 'family-meal', 'solo-cooking', 'learning-session', 'quick-meal', 'comfort-food'] }]
}, { timestamps: true });

module.exports = mongoose.model('MealHistory', mealHistorySchema);
