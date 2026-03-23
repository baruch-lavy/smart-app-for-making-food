const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Pantry = require('../models/Pantry');

router.get('/', auth, async (req, res) => {
  try {
    let pantry = await Pantry.findOne({ userId: req.user.id });
    if (!pantry) pantry = { items: [] };
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    let pantry = await Pantry.findOne({ userId: req.user.id });
    if (!pantry) pantry = new Pantry({ userId: req.user.id, items: [] });
    const newItems = Array.isArray(req.body) ? req.body : [req.body];
    pantry.items.push(...newItems);
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:itemId', auth, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ userId: req.user.id });
    if (!pantry) return res.status(404).json({ message: 'Pantry not found' });
    pantry.items = pantry.items.filter(item => item._id.toString() !== req.params.itemId);
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
