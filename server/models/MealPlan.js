const mongoose = require('mongoose');

const dayPlanSchema = {
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
  recipeTitle: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
};

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: Date, required: true },
  days: {
    monday:    dayPlanSchema,
    tuesday:   dayPlanSchema,
    wednesday: dayPlanSchema,
    thursday:  dayPlanSchema,
    friday:    dayPlanSchema,
    saturday:  dayPlanSchema,
    sunday:    dayPlanSchema,
  }
}, { timestamps: true });

mealPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
