const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShoppingList = require('../models/ShoppingList');
const { generateShoppingListForRecipe, suggestSmartBundling } = require('../services/shoppingService');

router.get('/', auth, async (req, res) => {
  try {
    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = { items: [] };
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    await ShoppingList.findOneAndDelete({ userId: req.user.id });
    const list = new ShoppingList({ userId: req.user.id, items: req.body.items || [] });
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = new ShoppingList({ userId: req.user.id, items: [] });
    list.items.push(req.body);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:itemId/check', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) return res.status(404).json({ message: 'Shopping list not found' });
    const item = list.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
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

router.post('/generate-from-recipe/:recipeId', auth, async (req, res) => {
  try {
    const shoppingList = await generateShoppingListForRecipe(req.user.id, req.params.recipeId);
    res.json(shoppingList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/smart-bundling', auth, async (req, res) => {
  try {
    const currentList = await ShoppingList.findOne({ userId: req.user.id });
    
    if (!currentList || currentList.items.length === 0) {
      return res.json({ suggestedRecipes: [], unlockedRecipeCount: 0, reason: 'No items in shopping list' });
    }
    
    const bundling = await suggestSmartBundling(req.user.id, currentList);
    res.json(bundling);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/set-budget', auth, async (req, res) => {
  try {
    const { budgetTarget } = req.body;
    const list = await ShoppingList.findOne({ userId: req.user.id });
    
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }
    
    list.budgetTarget = budgetTarget;
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/price-alert', auth, async (req, res) => {
  try {
    const { item, currentPrice, alertPrice } = req.body;
    const list = await ShoppingList.findOne({ userId: req.user.id });
    
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }
    
    list.priceAlerts.push({
      item,
      currentPrice,
      alertPrice,
      active: true
    });
    
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/clear-checked', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) return res.status(404).json({ message: 'Shopping list not found' });
    
    list.items = list.items.filter(item => !item.checked);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
