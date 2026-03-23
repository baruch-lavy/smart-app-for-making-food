const mongoose = require('mongoose');

const pantrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    quantity: String,
    unit: String,
    expiresAt: Date,
    addedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Pantry', pantrySchema);
