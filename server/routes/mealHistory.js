const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealHistory = require('../models/MealHistory');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const history = await MealHistory.find({ userId: req.user.id })
      .sort({ cookedAt: -1 })
      .populate('recipeId');
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { recipeId, recipeTitle, cookedAt, cookingSession, contextTags } = req.body;
    
    const entry = new MealHistory({ 
      userId: req.user.id, 
      recipeId, 
      recipeTitle, 
      cookedAt: cookedAt || new Date(),
      cookingSession: cookingSession || {},
      contextTags: contextTags || []
    });
    
    await entry.save();
    
    const user = await User.findById(req.user.id);
    user.totalMealsCooked = (user.totalMealsCooked || 0) + 1;
    user.lastCookedDate = new Date();
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (user.lastCookedDate && new Date(user.lastCookedDate) >= oneDayAgo) {
      user.currentStreak = (user.currentStreak || 0) + 1;
      user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
    } else {
      user.currentStreak = 1;
    }
    
    await user.save();
    
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/rate', auth, async (req, res) => {
  try {
    const { 
      rating, 
      feedback, 
      notes, 
      tasteRating, 
      difficultyExperienced, 
      wouldCookAgain,
      leftoverAmount,
      actualCookingTime,
      actualPrepTime,
      techniquesPracticed
    } = req.body;
    
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (feedback !== undefined) updateData.feedback = feedback;
    if (notes !== undefined) updateData.notes = notes;
    if (tasteRating !== undefined) updateData.tasteRating = tasteRating;
    if (difficultyExperienced !== undefined) updateData.difficultyExperienced = difficultyExperienced;
    if (wouldCookAgain !== undefined) updateData.wouldCookAgain = wouldCookAgain;
    if (leftoverAmount !== undefined) updateData.leftoverAmount = leftoverAmount;
    if (actualCookingTime !== undefined) updateData.actualCookingTime = actualCookingTime;
    if (actualPrepTime !== undefined) updateData.actualPrepTime = actualPrepTime;
    if (techniquesPracticed !== undefined) updateData.techniquesPracticed = techniquesPracticed;
    
    const entry = await MealHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true }
    );
    
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    if (techniquesPracticed && techniquesPracticed.length > 0) {
      const user = await User.findById(req.user.id);
      techniquesPracticed.forEach(technique => {
        const existingSkillIndex = user.skillProgression.findIndex(s => s.technique === technique);
        if (existingSkillIndex >= 0) {
          user.skillProgression[existingSkillIndex].level = Math.min(
            100, 
            user.skillProgression[existingSkillIndex].level + 5
          );
          user.skillProgression[existingSkillIndex].timesPerformed += 1;
          user.skillProgression[existingSkillIndex].lastPracticed = new Date();
        } else {
          user.skillProgression.push({
            technique,
            level: 10,
            timesPerformed: 1,
            lastPracticed: new Date()
          });
        }
      });
      await user.save();
    }
    
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/cooking-session', auth, async (req, res) => {
  try {
    const { startedAt, completedAt, stepsCompleted, currentStep, mistakesMade, notesAdded, wasSuccessful } = req.body;
    
    const entry = await MealHistory.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    entry.cookingSession = {
      startedAt: startedAt || entry.cookingSession?.startedAt,
      completedAt: completedAt || entry.cookingSession?.completedAt,
      stepsCompleted: stepsCompleted || entry.cookingSession?.stepsCompleted || [],
      currentStep: currentStep !== undefined ? currentStep : entry.cookingSession?.currentStep,
      mistakesMade: mistakesMade || entry.cookingSession?.mistakesMade || [],
      notesAdded: notesAdded || entry.cookingSession?.notesAdded || [],
      wasSuccessful: wasSuccessful !== undefined ? wasSuccessful : true
    };
    
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const totalMeals = await MealHistory.countDocuments({ userId: req.user.id });
    
    const recentMeals = await MealHistory.find({ userId: req.user.id })
      .sort({ cookedAt: -1 })
      .limit(10)
      .populate('recipeId');
    
    const ratings = recentMeals.map(m => m.rating).filter(Boolean);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
      : 0;
    
    const cuisines = [...new Set(recentMeals.map(m => m.recipeId?.cuisine).filter(Boolean))];
    
    res.json({
      totalMeals,
      averageRating: Math.round(avgRating * 10) / 10,
      recentCuisines: cuisines,
      recentMeals: recentMeals.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
