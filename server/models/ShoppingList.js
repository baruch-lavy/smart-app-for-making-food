const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    quantity: String,
    unit: String,
    checked: { type: Boolean, default: false },
    recipeSource: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
