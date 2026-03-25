const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const { 
  predictRecipeSuccess,
  generateWeeklyInsight,
  updateAnalytics,
  trackEvent,
  saveRecipeFeedback,
  getPreferenceSignals
} = require('../services/analyticsService');

router.get('/overview', auth, async (req, res) => {
  try {
    let analytics = await Analytics.findOne({ userId: req.userId });
    
    if (!analytics) {
      analytics = await updateAnalytics(req.userId);
    }
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/predict-success/:recipeId', auth, async (req, res) => {
  try {
    const prediction = await predictRecipeSuccess(req.userId, req.params.recipeId);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/weekly-insight', auth, async (req, res) => {
  try {
    const weekStartDate = req.query.weekStart 
      ? new Date(req.query.weekStart) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const insight = await generateWeeklyInsight(req.userId, weekStartDate);
    res.json(insight);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/update', auth, async (req, res) => {
  try {
    const analytics = await updateAnalytics(req.userId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ⭐ Track event
router.post('/event', auth, async (req, res) => {
  try {
    const { type, metadata } = req.body;

    const event = await trackEvent(req.userId, type, metadata);

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ⭐ Save feedback
router.post('/feedback', auth, async (req, res) => {
  try {
    const result = await saveRecipeFeedback({
      userId: req.userId,
      ...req.body
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ⭐ Get signals (for decision engine)
router.get('/signals', auth, async (req, res) => {
  try {
    const signals = await getPreferenceSignals(req.userId);
    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
