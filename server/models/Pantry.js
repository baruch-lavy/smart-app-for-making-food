const mongoose = require('mongoose');

const pantryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: String,
  expiresAt: Date,
  addedAt: { type: Date, default: Date.now },
  
  barcode: String,
  category: { type: String, enum: ['produce', 'dairy', 'meat', 'pantry-staple', 'spices', 'frozen', 'beverages', 'other'], default: 'other' },
  brand: String,
  imageUrl: String,
  
  nutritionPer100g: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sodium: Number
  },
  
  price: Number,
  purchasedFrom: String,
  
  usageTracking: {
    totalUsed: { type: Number, default: 0 },
    lastUsed: Date,
    timesUsed: { type: Number, default: 0 },
    averageUsagePerWeek: { type: Number, default: 0 }
  },
  
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  notes: String,
  storageLocation: String
});

const pantrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [pantryItemSchema],
  
  analytics: {
    totalItemsAdded: { type: Number, default: 0 },
    totalItemsExpired: { type: Number, default: 0 },
    totalWasteValue: { type: Number, default: 0 },
    mostUsedItems: [String],
    leastUsedItems: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Pantry', pantrySchema);
