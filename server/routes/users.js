const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

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

module.exports = router;
