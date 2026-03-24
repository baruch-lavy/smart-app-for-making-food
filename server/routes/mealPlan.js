const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealPlan = require('../models/MealPlan');

router.post('/create', auth, async (req, res) => {
  try {
    const { weekStartDate, weekEndDate, plannedMeals } = req.body;
    
    const mealPlan = new MealPlan({
      userId: req.userId,
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate),
      plannedMeals: plannedMeals || []
    });
    
    await mealPlan.save();
    res.status(201).json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/current', auth, async (req, res) => {
  try {
    const now = new Date();
    
    const mealPlan = await MealPlan.findOne({
      userId: req.userId,
      weekStartDate: { $lte: now },
      weekEndDate: { $gte: now }
    }).populate('plannedMeals.recipeId');
    
    res.json(mealPlan || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ userId: req.userId })
      .sort({ weekStartDate: -1 })
      .limit(10);
    
    res.json(mealPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/add-meal', auth, async (req, res) => {
  try {
    const { date, mealType, recipeId, recipeTitle, servings } = req.body;
    
    const mealPlan = await MealPlan.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    
    mealPlan.plannedMeals.push({
      date: new Date(date),
      mealType,
      recipeId,
      recipeTitle,
      servings
    });
    
    await mealPlan.save();
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/meal/:mealId', auth, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    
    mealPlan.plannedMeals = mealPlan.plannedMeals.filter(
      m => m._id.toString() !== req.params.mealId
    );
    
    await mealPlan.save();
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/generate-shopping-list', auth, async (req, res) => {
  try {
    const { generateWeeklyMealPrepList } = require('../services/shoppingService');
    
    const shoppingList = await generateWeeklyMealPrepList(req.userId, req.params.id);
    
    res.json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
