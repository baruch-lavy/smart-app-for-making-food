const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');
const { suggestRecipes } = require('../services/decisionEngine');
const { searchMeals, getMealFromAPI } = require('../services/mealdbService');
const spoonacular = require('../services/spoonacularService');

router.get('/', async (req, res) => {
  try {
    const { cuisine, difficulty, maxTime, tags, q } = req.query;
    const filter = {};
    if (cuisine) filter.cuisine = cuisine;
    if (difficulty) filter.difficulty = difficulty;
    if (maxTime) filter.$expr = { $lte: [{ $add: ['$cookingTime', '$prepTime'] }, parseInt(maxTime)] };
    if (tags) filter.tags = { $in: tags.split(',') };
    if (q) filter.title = { $regex: q, $options: 'i' };
    const recipes = await Recipe.find(filter);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search recipes from the internet
// Uses Spoonacular (whole internet) when SPOONACULAR_API_KEY is set, else TheMealDB fallback
router.get('/search', async (req, res) => {
  try {
    const { q, diet, cuisine, maxTime } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    // Try Spoonacular first
    if (spoonacular.isEnabled()) {
      const results = await spoonacular.searchRecipes(q.trim(), {
        number: 12,
        diet,
        cuisine,
        maxReadyTime: maxTime ? parseInt(maxTime) : undefined,
      });
      if (results) return res.json(results);
    }

    // Fallback: TheMealDB
    const results = await searchMeals(q.trim());
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// Import a Spoonacular recipe by ID — upserts into MongoDB and returns the full doc
router.get('/spoonacular/:spoonacularId', async (req, res) => {
  try {
    const { spoonacularId } = req.params;
    let recipe = await Recipe.findOne({ spoonacularId });
    if (!recipe) {
      const data = await spoonacular.getRecipeById(spoonacularId);
      if (!data) return res.status(404).json({ message: 'Recipe not found on Spoonacular' });
      recipe = await Recipe.findOneAndUpdate(
        { spoonacularId },
        { $setOnInsert: data },
        { upsert: true, new: true }
      );
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Import a TheMealDB recipe by mealdbId — upserts into MongoDB and returns the full doc
router.get('/mealdb/:mealdbId', async (req, res) => {
  try {
    const { mealdbId } = req.params;
    let recipe = await Recipe.findOne({ mealdbId });
    if (!recipe) {
      const data = await getMealFromAPI(mealdbId);
      if (!data) return res.status(404).json({ message: 'Recipe not found on TheMealDB' });
      recipe = await Recipe.findOneAndUpdate(
        { mealdbId },
        { $setOnInsert: data },
        { upsert: true, new: true }
      );
    }
    res.json(recipe);
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
    const { intent, availableIngredients, maxTime } = req.body;
    const suggestions = await suggestRecipes({ userId: req.user.id, intent, availableIngredients, maxTime });
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
