const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: String,
  unit: String,
  checked: { type: Boolean, default: false },
  recipeSource: String,
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  
  category: { type: String, enum: ['produce', 'dairy', 'meat', 'pantry-staple', 'spices', 'frozen', 'beverages', 'other'], default: 'other' },
  
  priceEstimate: Number,
  actualPrice: Number,
  
  storeAisle: String,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  
  substitutionOptions: [{ name: String, reason: String }],
  
  addedAt: { type: Date, default: Date.now },
  checkedAt: Date,
  
  notes: String
});

const shoppingListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [shoppingListItemSchema],
  
  listType: { type: String, enum: ['single-recipe', 'weekly-meal-prep', 'pantry-restock', 'custom'], default: 'custom' },
  
  budgetTarget: Number,
  estimatedTotal: Number,
  actualTotal: Number,
  
  targetStore: String,
  
  weekPlanning: {
    startDate: Date,
    endDate: Date,
    mealPlan: [{
      date: Date,
      meal: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
      recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
      recipeTitle: String
    }]
  },
  
  smartBundling: {
    suggestedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    unlockedRecipeCount: Number,
    reason: String
  },
  
  priceAlerts: [{
    item: String,
    currentPrice: Number,
    alertPrice: Number,
    active: { type: Boolean, default: true }
  }],
  
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
