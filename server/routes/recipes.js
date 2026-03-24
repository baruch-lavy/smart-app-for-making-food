const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');
const { suggestRecipes, calculateMissingIngredients } = require('../services/decisionEngine');

router.get('/', async (req, res) => {
  try {
    const { cuisine, difficulty, maxTime, tags, dietary } = req.query;
    const filter = {};
    
    if (cuisine) filter.cuisine = cuisine;
    if (difficulty) filter.difficulty = difficulty;
    if (maxTime) filter.$expr = { $lte: [{ $add: ['$cookingTime', '$prepTime'] }, parseInt(maxTime)] };
    if (tags) filter.tags = { $in: tags.split(',') };
    
    if (dietary) {
      const dietaryFilters = dietary.split(',');
      dietaryFilters.forEach(d => {
        const dietaryFieldName = `dietaryInfo.is${d.charAt(0).toUpperCase() + d.slice(1)}`;
        filter[dietaryFieldName] = true;
      });
    }
    
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
    const { intent, availableIngredients, maxTime, currentContext } = req.body;
    const suggestions = await suggestRecipes({ 
      userId: req.user.id, 
      intent, 
      availableIngredients, 
      maxTime,
      currentContext: currentContext || {}
    });
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/missing-ingredients', auth, async (req, res) => {
  try {
    const result = await calculateMissingIngredients(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/substitutions', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    
    res.json({
      substitutionGuide: recipe.substitutionGuide || [],
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        substitutions: ing.substitutions || []
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/filter/leftover-friendly', async (req, res) => {
  try {
    const recipes = await Recipe.find({ leftoverFriendly: true });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/filter/quick-meals', async (req, res) => {
  try {
    const recipes = await Recipe.find({
      $expr: { $lte: [{ $add: ['$cookingTime', '$prepTime'] }, 30] }
    });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/filter/by-energy/:energyLevel', async (req, res) => {
  try {
    const recipes = await Recipe.find({ 
      energyLevelRequired: req.params.energyLevel 
    });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/search/cuisines', async (req, res) => {
  try {
    const cuisines = await Recipe.distinct('cuisine');
    res.json(cuisines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/increment-cook-count', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    
    if (!recipe.communityRatings) {
      recipe.communityRatings = {
        averageRating: 0,
        totalRatings: 0,
        completionRate: 0
      };
    }
    
    recipe.communityRatings.completionRate = 
      ((recipe.communityRatings.completionRate || 0) * 
       (recipe.communityRatings.totalRatings || 1) + 1) / 
      ((recipe.communityRatings.totalRatings || 0) + 1);
    
    await recipe.save();
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
