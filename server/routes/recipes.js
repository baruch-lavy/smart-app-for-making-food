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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
