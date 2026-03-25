const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  ExperienceSession,
  UserExperiencePreferences,
} = require("../models/Experience");

router.post("/session/start", auth, async (req, res) => {
  try {
    const { recipeId, musicSettings, ambianceSettings, socialCooking } =
      req.body;

    const session = new ExperienceSession({
      userId: req.user.id,
      recipeId,
      musicSettings: musicSettings || { enabled: false },
      ambianceSettings: ambianceSettings || { enabled: false },
      socialCooking: socialCooking || { enabled: false },
      sessionStartedAt: new Date(),
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/session/:id/end", auth, async (req, res) => {
  try {
    const { sessionRating, experienceFeedback } = req.body;

    const session = await ExperienceSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.sessionEndedAt = new Date();
    session.sessionRating = sessionRating;
    session.experienceFeedback = experienceFeedback;

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/preferences", auth, async (req, res) => {
  try {
    let preferences = await UserExperiencePreferences.findOne({
      userId: req.user.id,
    });

    if (!preferences) {
      preferences = new UserExperiencePreferences({
        userId: req.user.id,
        defaultMusicPreferences: [],
      });
      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/preferences", auth, async (req, res) => {
  try {
    const updates = req.body;

    let preferences = await UserExperiencePreferences.findOne({
      userId: req.user.id,
    });

    if (!preferences) {
      preferences = new UserExperiencePreferences({ userId: req.user.id });
    }

    Object.assign(preferences, updates);
    await preferences.save();

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/sessions/recent", auth, async (req, res) => {
  try {
    const sessions = await ExperienceSession.find({ userId: req.user.id })
      .sort({ sessionStartedAt: -1 })
      .limit(10)
      .populate("recipeId");

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
