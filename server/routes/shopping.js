const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ShoppingList = require("../models/ShoppingList");
const Recipe = require("../models/Recipe");
const Pantry = require("../models/Pantry");
const { getMissingAndSubstitutions } = require("../services/decisionEngine");
const {
  generateShoppingListForRecipe,
  generateWeeklyMealPrepList,
  suggestSmartBundling,
} = require("../services/shoppingService");

function sanitizeItem(item) {
  if (!item || !String(item.name || "").trim()) return null;
  return {
    name: String(item.name).trim(),
    quantity: String(item.quantity || item.amount || "").trim(),
    unit: String(item.unit || "").trim(),
    checked: Boolean(item.checked),
    recipeSource: String(item.recipeSource || "").trim(),
  };
}

router.get("/", auth, async (req, res) => {
  try {
    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = { items: [] };
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Returns which recipe ingredients are missing from pantry vs already available
router.get("/missing/:recipeId", auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const pantryDoc = await Pantry.findOne({ userId: req.user.id });
    const pantryItems = pantryDoc?.items || [];

    const { missing, substitutions } = getMissingAndSubstitutions(
      recipe,
      pantryItems,
    );
    const pantryNames = pantryItems.map((p) => p.name.toLowerCase());
    const available = recipe.ingredients.filter((ing) => {
      const ingLower = ing.name.toLowerCase();
      return pantryNames.some(
        (p) => p.includes(ingLower) || ingLower.includes(p),
      );
    });

    res.json({ missing, available, substitutions, recipeTitle: recipe.title });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Adds all missing ingredients for a recipe to the user's shopping list
router.post("/from-recipe/:recipeId", auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const pantryDoc = await Pantry.findOne({ userId: req.user.id });
    const pantryItems = pantryDoc?.items || [];

    const { missing } = getMissingAndSubstitutions(recipe, pantryItems);

    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = new ShoppingList({ userId: req.user.id, items: [] });

    // Avoid duplicates — skip items already in the shopping list
    const existingNames = list.items.map((i) => i.name.toLowerCase());
    const toAdd = missing.filter(
      (m) => !existingNames.includes(m.name.toLowerCase()),
    );

    toAdd.forEach((ing) => {
      list.items.push({
        name: ing.name,
        quantity: ing.amount,
        unit: ing.unit,
        recipeSource: recipe.title,
      });
    });

    await list.save();
    res.json({
      list,
      added: toAdd.length,
      skipped: missing.length - toAdd.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    await ShoppingList.findOneAndDelete({ userId: req.user.id });
    const list = new ShoppingList({
      userId: req.user.id,
      items: req.body.items || [],
    });
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/add", auth, async (req, res) => {
  try {
    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = new ShoppingList({ userId: req.user.id, items: [] });
    const item = sanitizeItem(req.body);
    if (!item)
      return res.status(400).json({ message: "Invalid shopping item" });
    list.items.push(item);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/bulk-add", auth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items)
      ? req.body.items.map(sanitizeItem).filter(Boolean)
      : [];

    if (items.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid shopping items provided" });
    }

    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = new ShoppingList({ userId: req.user.id, items: [] });
    list.items.push(...items);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:itemId/check", auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list)
      return res.status(404).json({ message: "Shopping list not found" });
    const item = list.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    item.checked = !item.checked;
    if (item.checked) {
      item.checkedAt = new Date();
    }
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/generate-from-recipe/:recipeId", auth, async (req, res) => {
  try {
    const shoppingList = await generateShoppingListForRecipe(
      req.user.id,
      req.params.recipeId,
    );
    res.json(shoppingList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/smart-bundling", auth, async (req, res) => {
  try {
    const currentList = await ShoppingList.findOne({ userId: req.user.id });

    if (!currentList || currentList.items.length === 0) {
      return res.json({
        suggestedRecipes: [],
        unlockedRecipeCount: 0,
        reason: "No items in shopping list",
      });
    }

    const bundling = await suggestSmartBundling(req.user.id, currentList);
    res.json(bundling);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/set-budget", auth, async (req, res) => {
  try {
    const { budgetTarget } = req.body;
    const list = await ShoppingList.findOne({ userId: req.user.id });

    if (!list) {
      return res.status(404).json({ message: "Shopping list not found" });
    }

    list.budgetTarget = budgetTarget;
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/price-alert", auth, async (req, res) => {
  try {
    const { item, currentPrice, alertPrice } = req.body;
    const list = await ShoppingList.findOne({ userId: req.user.id });

    if (!list) {
      return res.status(404).json({ message: "Shopping list not found" });
    }

    list.priceAlerts.push({
      item,
      currentPrice,
      alertPrice,
      active: true,
    });

    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/clear-checked", auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list)
      return res.status(404).json({ message: "Shopping list not found" });

    list.items = list.items.filter((item) => !item.checked);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
