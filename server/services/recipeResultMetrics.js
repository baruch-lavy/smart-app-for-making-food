const mongoose = require('mongoose');
const MealHistory = require('../models/MealHistory');

const DIFFICULTY_RANK = { easy: 1, medium: 2, hard: 3 };

function toPlainRecipe(recipe) {
  if (!recipe) return null;
  if (typeof recipe.toObject === 'function') return recipe.toObject();
  return { ...recipe };
}

function calculateMatchPercent(recipe, availableIngredients) {
  const available = Array.isArray(availableIngredients)
    ? availableIngredients.map(item => String(item).toLowerCase()).filter(Boolean)
    : [];

  if (available.length === 0) return 0;

  const recipeIngredients = (recipe.ingredients || [])
    .map(ingredient => String(ingredient.name || '').toLowerCase())
    .filter(Boolean);

  if (recipeIngredients.length === 0) return 0;

  const matchCount = recipeIngredients.filter(recipeIngredient => (
    available.some(availableIngredient => recipeIngredient.includes(availableIngredient) || availableIngredient.includes(recipeIngredient))
  )).length;

  return Math.round((matchCount / recipeIngredients.length) * 100);
}

function calculateMainIngredientMatch(recipe, mainIngredient) {
  if (!mainIngredient) return false;
  const normalizedMain = String(mainIngredient).toLowerCase();
  return (recipe.ingredients || []).some(ingredient => {
    const ingredientName = String(ingredient.name || '').toLowerCase();
    return ingredientName.includes(normalizedMain) || normalizedMain.includes(ingredientName);
  });
}

function calculateGeneratedPopularity(index, recipe) {
  const sourceBoost = recipe.source?.siteName ? 8 : 0;
  const imageBoost = recipe.imageUrl || recipe.sourceImageUrl ? 6 : 0;
  return Math.max(35, 90 - (index * 8) + sourceBoost + imageBoost);
}

async function buildPopularityMap(recipes) {
  const recipeIds = Array.from(new Set((recipes || [])
    .map(recipe => String(recipe?._id || ''))
    .filter(id => mongoose.Types.ObjectId.isValid(id))));

  if (recipeIds.length === 0) return new Map();

  const rows = await MealHistory.aggregate([
    { $match: { recipeId: { $in: recipeIds.map(id => new mongoose.Types.ObjectId(id)) } } },
    {
      $group: {
        _id: '$recipeId',
        cookCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  return new Map(rows.map(row => [String(row._id), {
    cookCount: row.cookCount || 0,
    avgRating: Number(row.avgRating || 0),
  }]));
}

function enrichRecipeResults(recipes, options = {}) {
  const popularityMap = options.popularityMap || new Map();
  const availableIngredients = options.availableIngredients || [];
  const mainIngredient = options.mainIngredient || '';
  const resultType = options.resultType || 'database';

  return (recipes || []).map((recipe, index) => {
    const plainRecipe = toPlainRecipe(recipe);
    const popularity = popularityMap.get(String(plainRecipe._id)) || { cookCount: 0, avgRating: 0 };
    const totalTime = Number(plainRecipe.prepTime || 0) + Number(plainRecipe.cookingTime || 0);
    const matchPercent = calculateMatchPercent(plainRecipe, availableIngredients);
    const mainIngredientMatch = calculateMainIngredientMatch(plainRecipe, mainIngredient);
    const popularityScore = resultType === 'generated'
      ? calculateGeneratedPopularity(index, plainRecipe)
      : Math.round((popularity.cookCount * 18) + (popularity.avgRating * 20));

    return {
      ...plainRecipe,
      metrics: {
        resultType,
        recommendedRank: index + 1,
        totalTime,
        difficultyRank: DIFFICULTY_RANK[plainRecipe.difficulty] || 99,
        matchPercent,
        popularityScore,
        cookCount: popularity.cookCount,
        averageRating: Number(popularity.avgRating || 0),
        hasImage: Boolean(plainRecipe.imageUrl || plainRecipe.sourceImageUrl),
        mainIngredientMatch,
      },
    };
  });
}

module.exports = {
  buildPopularityMap,
  enrichRecipeResults,
};