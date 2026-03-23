const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealHistory = require('../models/MealHistory');

router.get('/', auth, async (req, res) => {
  try {
    const history = await MealHistory.find({ userId: req.user.id }).sort({ cookedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { recipeId, recipeTitle, cookedAt } = req.body;
    const entry = new MealHistory({ userId: req.user.id, recipeId, recipeTitle, cookedAt: cookedAt || new Date() });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, feedback, notes } = req.body;
    const entry = await MealHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { rating, feedback, notes },
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
