const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');
const { suggestRecipes } = require('../services/decisionEngine');

router.get('/', async (req, res) => {
  try {
    const { cuisine, difficulty, maxTime, tags } = req.query;
    const filter = {};
    if (cuisine) filter.cuisine = cuisine;
    if (difficulty) filter.difficulty = difficulty;
    if (maxTime) filter.$expr = { $lte: [{ $add: ['$cookingTime', '$prepTime'] }, parseInt(maxTime)] };
    if (tags) filter.tags = { $in: tags.split(',') };
    const recipes = await Recipe.find(filter);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/suggest', auth, async (req, res) => {
  try {
    const { intent, availableIngredients, maxTime, difficulty, mainIngredient } = req.body;
    const result = await suggestRecipes({ userId: req.user.id, intent, availableIngredients, maxTime, difficulty, mainIngredient });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
