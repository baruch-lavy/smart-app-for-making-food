const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { tastePreferences, dislikes, dietaryRestrictions, cookingLevel, learningMode, onboardingComplete } = req.body;
    const updates = {};
    if (tastePreferences !== undefined) updates.tastePreferences = tastePreferences;
    if (dislikes !== undefined) updates.dislikes = dislikes;
    if (dietaryRestrictions !== undefined) updates.dietaryRestrictions = dietaryRestrictions;
    if (cookingLevel !== undefined) updates.cookingLevel = cookingLevel;
    if (learningMode !== undefined) updates.learningMode = learningMode;
    if (onboardingComplete !== undefined) updates.onboardingComplete = onboardingComplete;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's favorite recipes (populated)
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites').select('favorites');
    res.json(user?.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add recipe to favorites
router.post('/favorites/:recipeId', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favorites: req.params.recipeId } },
      { new: true }
    ).select('favorites');
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove recipe from favorites
router.delete('/favorites/:recipeId', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favorites: req.params.recipeId } },
      { new: true }
    ).select('favorites');
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
