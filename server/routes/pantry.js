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
    if (!pantry) {
      pantry = new Pantry({ 
        userId: req.user.id, 
        items: [],
        analytics: {
          totalItemsAdded: 0,
          totalItemsExpired: 0,
          totalWasteValue: 0
        }
      });
    }
    
    const newItems = Array.isArray(req.body) ? req.body : [req.body];
    
    newItems.forEach(item => {
      item.addedBy = req.user.id;
      item.addedAt = new Date();
      if (!item.usageTracking) {
        item.usageTracking = {
          totalUsed: 0,
          timesUsed: 0,
          averageUsagePerWeek: 0
        };
      }
    });
    
    pantry.items.push(...newItems);
    pantry.analytics.totalItemsAdded += newItems.length;
    
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/barcode-scan', auth, async (req, res) => {
  try {
    const { barcode, name, quantity, unit, category, brand, nutritionPer100g, price } = req.body;
    
    let pantry = await Pantry.findOne({ userId: req.user.id });
    if (!pantry) {
      pantry = new Pantry({ userId: req.user.id, items: [] });
    }
    
    const existingItemIndex = pantry.items.findIndex(item => item.barcode === barcode);
    
    if (existingItemIndex >= 0) {
      pantry.items[existingItemIndex].quantity += quantity || 1;
    } else {
      pantry.items.push({
        name,
        quantity: quantity || 1,
        unit,
        barcode,
        category,
        brand,
        nutritionPer100g,
        price,
        addedBy: req.user.id,
        usageTracking: {
          totalUsed: 0,
          timesUsed: 0,
          averageUsagePerWeek: 0
        }
      });
    }
    
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/analytics', auth, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ userId: req.user.id });
    
    if (!pantry) {
      return res.json({
        totalItems: 0,
        expiringItems: [],
        mostUsedItems: [],
        leastUsedItems: [],
        totalWasteValue: 0
      });
    }
    
    const now = new Date();
    const expiringItems = pantry.items.filter(item => {
      if (!item.expiresAt) return false;
      const daysUntilExpiry = Math.floor((new Date(item.expiresAt) - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });
    
    const sortedByUsage = [...pantry.items].sort((a, b) => 
      (b.usageTracking?.timesUsed || 0) - (a.usageTracking?.timesUsed || 0)
    );
    
    const mostUsedItems = sortedByUsage.slice(0, 5).map(item => ({
      name: item.name,
      timesUsed: item.usageTracking?.timesUsed || 0
    }));
    
    const leastUsedItems = sortedByUsage.slice(-5).reverse().map(item => ({
      name: item.name,
      timesUsed: item.usageTracking?.timesUsed || 0
    }));
    
    res.json({
      totalItems: pantry.items.length,
      expiringItems,
      mostUsedItems,
      leastUsedItems,
      totalItemsAdded: pantry.analytics?.totalItemsAdded || 0,
      totalItemsExpired: pantry.analytics?.totalItemsExpired || 0,
      totalWasteValue: pantry.analytics?.totalWasteValue || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:itemId/usage', auth, async (req, res) => {
  try {
    const { quantityUsed } = req.body;
    const pantry = await Pantry.findOne({ userId: req.user.id });
    
    if (!pantry) {
      return res.status(404).json({ message: 'Pantry not found' });
    }
    
    const item = pantry.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (!item.usageTracking) {
      item.usageTracking = {
        totalUsed: 0,
        timesUsed: 0,
        averageUsagePerWeek: 0
      };
    }
    
    item.usageTracking.totalUsed += quantityUsed || 0;
    item.usageTracking.timesUsed += 1;
    item.usageTracking.lastUsed = new Date();
    
    item.quantity -= quantityUsed || 0;
    
    if (item.quantity <= 0) {
      pantry.items = pantry.items.filter(i => i._id.toString() !== req.params.itemId);
    }
    
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
    
    const itemToDelete = pantry.items.id(req.params.itemId);
    
    if (itemToDelete && itemToDelete.expiresAt && new Date(itemToDelete.expiresAt) < new Date()) {
      pantry.analytics.totalItemsExpired += 1;
      pantry.analytics.totalWasteValue += itemToDelete.price || 0;
    }
    
    pantry.items = pantry.items.filter(item => item._id.toString() !== req.params.itemId);
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:itemId/share', auth, async (req, res) => {
  try {
    const { sharedWithUserId } = req.body;
    const pantry = await Pantry.findOne({ userId: req.user.id });
    
    if (!pantry) {
      return res.status(404).json({ message: 'Pantry not found' });
    }
    
    const item = pantry.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (!item.sharedWith) {
      item.sharedWith = [];
    }
    
    if (!item.sharedWith.includes(sharedWithUserId)) {
      item.sharedWith.push(sharedWithUserId);
    }
    
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
