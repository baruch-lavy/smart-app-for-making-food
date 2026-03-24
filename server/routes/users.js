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
    const updates = req.body;
    const allowedUpdates = [
      'tastePreferences', 'dislikes', 'dietaryRestrictions', 'cookingLevel', 
      'learningMode', 'onboardingComplete', 'allergies', 'householdMembers',
      'voicePreferences', 'preferences'
    ];
    
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      filteredUpdates, 
      { new: true }
    ).select('-password');
    
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
router.post('/household-member', auth, async (req, res) => {
  try {
    const { name, relationship, age, dietaryRestrictions, allergies, dislikes, tastePreferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    user.householdMembers.push({
      name,
      relationship,
      age,
      dietaryRestrictions: dietaryRestrictions || [],
      allergies: allergies || [],
      dislikes: dislikes || [],
      tastePreferences: tastePreferences || [],
      isActive: true
    });
    
    await user.save();
    
    res.json(user.householdMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/household-member/:memberId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.householdMembers = user.householdMembers.filter(
      m => m._id.toString() !== req.params.memberId
    );
    
    await user.save();
    res.json(user.householdMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/unlock-achievement', auth, async (req, res) => {
  try {
    const { badge, title, description, category } = req.body;
    
    const user = await User.findById(req.user.id);
    
    const alreadyUnlocked = user.achievements.some(a => a.badge === badge);
    
    if (!alreadyUnlocked) {
      user.achievements.push({
        badge,
        title,
        description,
        category,
        unlockedAt: new Date()
      });
      
      await user.save();
    }
    
    res.json(user.achievements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/update-skill-progression', auth, async (req, res) => {
  try {
    const { technique, levelIncrease } = req.body;
    
    const user = await User.findById(req.user.id);
    
    const existingSkillIndex = user.skillProgression.findIndex(
      s => s.technique === technique
    );
    
    if (existingSkillIndex >= 0) {
      user.skillProgression[existingSkillIndex].level = Math.min(
        100,
        user.skillProgression[existingSkillIndex].level + (levelIncrease || 5)
      );
      user.skillProgression[existingSkillIndex].timesPerformed += 1;
      user.skillProgression[existingSkillIndex].lastPracticed = new Date();
    } else {
      user.skillProgression.push({
        technique,
        level: levelIncrease || 10,
        timesPerformed: 1,
        lastPracticed: new Date()
      });
    }
    
    await user.save();
    res.json(user.skillProgression);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const MealHistory = require('../models/MealHistory');
    
    const totalMeals = await MealHistory.countDocuments({ userId: req.user.id });
    
    const recentMeals = await MealHistory.find({ userId: req.user.id })
      .sort({ cookedAt: -1 })
      .limit(10);
    
    const ratings = recentMeals.map(m => m.rating).filter(Boolean);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
      : 0;
    
    res.json({
      totalMealsCooked: user.totalMealsCooked || totalMeals,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      averageRating: Math.round(avgRating * 10) / 10,
      achievements: user.achievements || [],
      skillProgression: user.skillProgression || []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
