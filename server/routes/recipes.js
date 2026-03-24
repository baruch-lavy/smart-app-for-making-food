const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { suggestRecipes } = require('../services/decisionEngine');
const { suggestInternetRecipes } = require('../services/aiRecipeService');
const { getGeneratedRecipe, saveGeneratedRecipe } = require('../services/generatedRecipeStore');
const { buildPopularityMap, enrichRecipeResults } = require('../services/recipeResultMetrics');

function dedupeRecipes(recipes) {
  const seen = new Set();
  return (recipes || []).filter(recipe => {
    const key = String(recipe?.title || recipe?.source?.url || recipe?._id || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
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

router.get('/generated/:id', auth, async (req, res) => {
  try {
    const recipe = getGeneratedRecipe(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Generated recipe not found or expired' });
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
    const { intent, availableIngredients, maxTime, difficulty, mainIngredient, childrenMode } = req.body;
    const user = await User.findById(req.user.id);

    const internetResult = await suggestInternetRecipes({
      user,
      intent,
      availableIngredients,
      maxTime,
      difficulty,
      mainIngredient,
      childrenMode,
    });

    if (internetResult?.mains?.length) {
      const storedMains = dedupeRecipes(internetResult.mains).map(saveGeneratedRecipe);
      const storedSide = internetResult.side ? saveGeneratedRecipe(internetResult.side) : null;
      const popularityMap = await buildPopularityMap(storedMains);
      const mains = enrichRecipeResults(storedMains, {
        popularityMap,
        availableIngredients,
        mainIngredient,
        resultType: 'generated',
      });
      const side = storedSide
        ? enrichRecipeResults([storedSide], {
            popularityMap,
            availableIngredients,
            mainIngredient,
            resultType: 'generated',
          })[0]
        : null;
      return res.json({
        mains,
        side,
        mode: 'generated',
        metadata: internetResult.metadata || null,
        sources: internetResult.sources || [],
      });
    }

    const result = await suggestRecipes({ userId: req.user.id, intent, availableIngredients, maxTime, difficulty, mainIngredient, childrenMode });
    const uniqueMains = dedupeRecipes(result.mains || []);
    const popularityMap = await buildPopularityMap([...uniqueMains, ...(result.side ? [result.side] : [])]);
    const mains = enrichRecipeResults(uniqueMains, {
      popularityMap,
      availableIngredients,
      mainIngredient,
      resultType: 'database',
    });
    const side = result.side
      ? enrichRecipeResults([result.side], {
          popularityMap,
          availableIngredients,
          mainIngredient,
          resultType: 'database',
        })[0]
      : null;
    const warnings = [];
    if (internetResult?.metadata?.warnings?.length) warnings.push(...internetResult.metadata.warnings);
    warnings.push('Showing local recipe suggestions as a fallback.');
    res.json({
      mains,
      side,
      mode: 'database',
      metadata: {
        providerState: internetResult?.metadata?.providerState || null,
        warnings,
        fallbackReason: internetResult?.metadata?.fallbackReason || 'ai-unavailable',
      },
      sources: internetResult?.sources || [],
    });
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
