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

const plannedMealSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  recipeTitle: String,
  servings: Number,
  
  cookingFor: [String],
  
  prepDayBatch: { type: Boolean, default: false },
  prepDayDate: Date,
  
  notes: String,
  
  isCooked: { type: Boolean, default: false },
  cookedAt: Date,
  
  leftoverSource: {
    fromMealId: { type: mongoose.Schema.Types.ObjectId },
    fromDate: Date
  }
});

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  weekStartDate: { type: Date, required: true },
  weekEndDate: { type: Date, required: true },
  
  plannedMeals: [plannedMealSchema],
  
  householdSchedule: [{
    memberName: String,
    date: Date,
    mealType: String,
    isHome: { type: Boolean, default: true },
    dietaryNeeds: [String]
  }],
  
  prepDayOptimization: {
    suggestedPrepDay: Date,
    batchCookingRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    estimatedPrepTime: Number,
    ingredientOverlap: Number
  },
  
  shoppingListGenerated: { type: Boolean, default: false },
  shoppingListId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShoppingList' },
  
  budgetEstimate: Number,
  caloriesPerDay: Number,
  nutritionBalance: {
    protein: Number,
    carbs: Number,
    fat: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
