const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { getProviderState } = require('../services/aiRecipeService');

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

router.get('/ai-status', auth, async (req, res) => {
  try {
    const providerState = getProviderState();
    const services = [
      {
        key: 'gemini',
        label: 'Gemini generation',
        configured: providerState.geminiConfigured,
        detail: providerState.geminiConfigured ? `Model: ${providerState.geminiModel}` : 'Add GEMINI_API_KEY to enable structured AI recipes.',
      },
      {
        key: 'search',
        label: 'Internet recipe search',
        configured: providerState.searchConfigured,
        detail: providerState.searchConfigured
          ? `Preferred: ${providerState.preferredSearchProvider}. Active: ${providerState.activeSearchProvider}.`
          : 'Add TAVILY_API_KEY or SERPAPI_API_KEY to search recipe sources on the web.',
      },
      {
        key: 'images',
        label: 'Recipe images',
        configured: providerState.imageProvider !== 'disabled',
        detail: providerState.imageProvider === 'disabled'
          ? 'Image generation is disabled. SVG fallback illustrations will be used.'
          : `Provider: ${providerState.imageProvider}`,
      },
    ];

    res.json({
      providerState,
      services,
      readyForFullAiRecipes: providerState.geminiConfigured && providerState.searchConfigured,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
