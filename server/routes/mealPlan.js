const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET current week's meal plan (creates if missing)
router.get('/', auth, async (req, res) => {
  try {
    const weekStart = getWeekStart();
    let plan = await MealPlan.findOne({ userId: req.user.id, weekStart });
    if (!plan) {
      plan = await MealPlan.create({ userId: req.user.id, weekStart });
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT assign a recipe to a day
router.put('/:day', auth, async (req, res) => {
  try {
    const { day } = req.params;
    if (!DAYS.includes(day)) return res.status(400).json({ message: 'Invalid day' });

    const { recipeId } = req.body;
    const weekStart = getWeekStart();

    let update;
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
      update = {
        [`days.${day}.recipeId`]: recipe._id,
        [`days.${day}.recipeTitle`]: recipe.title,
        [`days.${day}.imageUrl`]: recipe.imageUrl || '',
      };
    } else {
      update = {
        [`days.${day}.recipeId`]: null,
        [`days.${day}.recipeTitle`]: '',
        [`days.${day}.imageUrl`]: '',
      };
    }

    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id, weekStart },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE clear a day
router.delete('/:day', auth, async (req, res) => {
  try {
    const { day } = req.params;
    if (!DAYS.includes(day)) return res.status(400).json({ message: 'Invalid day' });
    const weekStart = getWeekStart();
    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id, weekStart },
      { $set: {
        [`days.${day}.recipeId`]: null,
        [`days.${day}.recipeTitle`]: '',
        [`days.${day}.imageUrl`]: '',
      }},
      { new: true, upsert: true }
    );
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
