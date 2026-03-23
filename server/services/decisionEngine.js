const User = require('../models/User');
const Recipe = require('../models/Recipe');
const MealHistory = require('../models/MealHistory');

async function suggestRecipes({ userId, intent, availableIngredients, maxTime }) {
  const user = await User.findById(userId);
  const { tastePreferences = [], dislikes = [], dietaryRestrictions = [] } = user || {};

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentHistory = await MealHistory.find({ userId, cookedAt: { $gte: sevenDaysAgo } });
  const recentRecipeIds = recentHistory.map(h => h.recipeId?.toString());

  let recipes = await Recipe.find({});

  if (availableIngredients && availableIngredients.length > 0) {
    const available = availableIngredients.map(i => i.toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      const matches = recipeIngredients.filter(ri => available.some(ai => ri.includes(ai) || ai.includes(ri)));
      return matches.length / recipeIngredients.length >= 0.5;
    });
  }

  if (intent === 'quick') {
    recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
  } else if (intent === 'easy') {
    recipes = recipes.filter(r => r.difficulty === 'easy');
  }

  if (maxTime) {
    recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= parseInt(maxTime));
  }

  const scored = recipes.map(recipe => {
    let score = 0;
    const tags = recipe.tags || [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());

    if (tastePreferences.some(pref => tags.some(t => t.toLowerCase().includes(pref.toLowerCase())))) {
      score += 20;
    }

    if (dislikes.some(dislike => ingredients.some(ing => ing.includes(dislike.toLowerCase())))) {
      score -= 40;
    }

    if (!recentRecipeIds.includes(recipe._id.toString())) {
      score += 15;
    }

    if (availableIngredients && availableIngredients.length > 0) {
      const available = availableIngredients.map(i => i.toLowerCase());
      const matchCount = ingredients.filter(ing => available.some(ai => ing.includes(ai) || ai.includes(ing))).length;
      score += matchCount * 10;
    }

    const restrictedMap = {
      'Vegetarian': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb'],
      'Vegan': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb', 'cheese', 'milk', 'butter', 'egg', 'cream', 'honey'],
      'Gluten-Free': ['flour', 'bread', 'pasta', 'wheat', 'soy sauce', 'barley'],
      'Dairy-Free': ['cheese', 'milk', 'butter', 'cream', 'yogurt'],
      'Nut-Free': ['almond', 'walnut', 'peanut', 'cashew', 'pecan', 'nut'],
    };
    for (const restriction of dietaryRestrictions) {
      const restricted = restrictedMap[restriction] || [];
      if (restricted.some(r => ingredients.some(ing => ing.includes(r)))) {
        score -= 10;
      }
    }

    return { recipe, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.recipe);
}

module.exports = { suggestRecipes };
