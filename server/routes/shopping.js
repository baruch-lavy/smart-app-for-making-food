const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShoppingList = require('../models/ShoppingList');

function sanitizeItem(item) {
  if (!item || !String(item.name || '').trim()) return null;
  return {
    name: String(item.name).trim(),
    quantity: String(item.quantity || item.amount || '').trim(),
    unit: String(item.unit || '').trim(),
    checked: Boolean(item.checked),
    recipeSource: String(item.recipeSource || '').trim(),
  };
}

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
    const item = sanitizeItem(req.body);
    if (!item) return res.status(400).json({ message: 'Invalid shopping item' });
    list.items.push(item);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/bulk-add', auth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items)
      ? req.body.items.map(sanitizeItem).filter(Boolean)
      : [];

    if (items.length === 0) {
      return res.status(400).json({ message: 'No valid shopping items provided' });
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

router.put('/:itemId/check', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) return res.status(404).json({ message: 'Shopping list not found' });
    const item = list.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.checked = !item.checked;
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
