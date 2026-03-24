const ShoppingList = require('../models/ShoppingList');
const Recipe = require('../models/Recipe');
const Pantry = require('../models/Pantry');

const generateShoppingListForRecipe = async (userId, recipeId) => {
  const recipe = await Recipe.findById(recipeId);
  const pantry = await Pantry.findOne({ userId });
  
  if (!recipe) {
    throw new Error('Recipe not found');
  }
  
  const pantryItemNames = pantry?.items?.map(item => item.name.toLowerCase()) || [];
  
  const missingItems = [];
  const estimatedTotalPrice = 0;
  
  recipe.ingredients.forEach(ingredient => {
    const ingredientNameLower = ingredient.name.toLowerCase();
    const isInPantry = pantryItemNames.some(p => 
      p.includes(ingredientNameLower) || ingredientNameLower.includes(p)
    );
    
    if (!isInPantry) {
      missingItems.push({
        name: ingredient.name,
        quantity: ingredient.amount,
        unit: ingredient.unit,
        recipeSource: recipe.title,
        recipeId: recipe._id,
        category: categorizeIngredient(ingredient.name),
        priority: 'medium'
      });
    }
  });
  
  let shoppingList = await ShoppingList.findOne({ userId });
  
  if (!shoppingList) {
    shoppingList = new ShoppingList({
      userId,
      items: [],
      listType: 'single-recipe'
    });
  }
  
  missingItems.forEach(item => {
    const existingItemIndex = shoppingList.items.findIndex(i => 
      i.name.toLowerCase() === item.name.toLowerCase()
    );
    
    if (existingItemIndex === -1) {
      shoppingList.items.push(item);
    }
  });
  
  await shoppingList.save();
  return shoppingList;
};

const generateWeeklyMealPrepList = async (userId, mealPlanId) => {
  const MealPlan = require('../models/MealPlan');
  
  const mealPlan = await MealPlan.findById(mealPlanId).populate('plannedMeals.recipeId');
  const pantry = await Pantry.findOne({ userId });
  
  if (!mealPlan) {
    throw new Error('Meal plan not found');
  }
  
  const allIngredients = {};
  
  mealPlan.plannedMeals.forEach(meal => {
    const recipe = meal.recipeId;
    if (recipe && recipe.ingredients) {
      recipe.ingredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase();
        if (!allIngredients[key]) {
          allIngredients[key] = {
            name: ingredient.name,
            totalQuantity: 0,
            unit: ingredient.unit,
            recipes: []
          };
        }
        allIngredients[key].totalQuantity += parseFloat(ingredient.amount) || 1;
        allIngredients[key].recipes.push(recipe.title);
      });
    }
  });
  
  const pantryItemNames = pantry?.items?.map(item => item.name.toLowerCase()) || [];
  
  const shoppingItems = [];
  
  Object.values(allIngredients).forEach(ingredient => {
    const ingredientNameLower = ingredient.name.toLowerCase();
    const isInPantry = pantryItemNames.some(p => 
      p.includes(ingredientNameLower) || ingredientNameLower.includes(p)
    );
    
    if (!isInPantry) {
      shoppingItems.push({
        name: ingredient.name,
        quantity: ingredient.totalQuantity.toString(),
        unit: ingredient.unit,
        recipeSource: ingredient.recipes.join(', '),
        category: categorizeIngredient(ingredient.name),
        priority: 'medium'
      });
    }
  });
  
  const shoppingList = new ShoppingList({
    userId,
    items: shoppingItems,
    listType: 'weekly-meal-prep',
    weekPlanning: {
      startDate: mealPlan.weekStartDate,
      endDate: mealPlan.weekEndDate
    }
  });
  
  await shoppingList.save();
  
  mealPlan.shoppingListGenerated = true;
  mealPlan.shoppingListId = shoppingList._id;
  await mealPlan.save();
  
  return shoppingList;
};

const suggestSmartBundling = async (userId, currentShoppingList) => {
  const pantry = await Pantry.findOne({ userId });
  const allRecipes = await Recipe.find({});
  
  const currentIngredients = currentShoppingList.items.map(i => i.name.toLowerCase());
  const pantryIngredients = pantry?.items?.map(i => i.name.toLowerCase()) || [];
  
  const combinedIngredients = [...new Set([...currentIngredients, ...pantryIngredients])];
  
  const recipeSuggestions = [];
  
  allRecipes.forEach(recipe => {
    const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
    const missingCount = recipeIngredients.filter(ri => 
      !combinedIngredients.some(ci => ri.includes(ci) || ci.includes(ri))
    ).length;
    
    if (missingCount <= 3 && missingCount > 0) {
      recipeSuggestions.push({
        recipe: recipe,
        missingCount: missingCount,
        matchPercentage: ((recipeIngredients.length - missingCount) / recipeIngredients.length) * 100
      });
    }
  });
  
  recipeSuggestions.sort((a, b) => a.missingCount - b.missingCount);
  
  return {
    suggestedRecipes: recipeSuggestions.slice(0, 5).map(s => s.recipe._id),
    unlockedRecipeCount: recipeSuggestions.length,
    reason: `Buy ${recipeSuggestions[0]?.missingCount || 0} more items to unlock ${recipeSuggestions.length} recipes`
  };
};

const categorizeIngredient = (ingredientName) => {
  const name = ingredientName.toLowerCase();
  
  if (['tomato', 'lettuce', 'onion', 'garlic', 'carrot', 'potato', 'pepper', 'spinach', 'cucumber'].some(v => name.includes(v))) {
    return 'produce';
  }
  if (['milk', 'cheese', 'butter', 'yogurt', 'cream'].some(d => name.includes(d))) {
    return 'dairy';
  }
  if (['chicken', 'beef', 'pork', 'fish', 'shrimp', 'lamb', 'turkey'].some(m => name.includes(m))) {
    return 'meat';
  }
  if (['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'cinnamon'].some(s => name.includes(s))) {
    return 'spices';
  }
  
  return 'other';
};

module.exports = {
  generateShoppingListForRecipe,
  generateWeeklyMealPrepList,
  suggestSmartBundling
};
