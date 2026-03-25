const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const MealHistory = require("../models/MealHistory");
const { getProviderState } = require("../services/aiRecipeService");

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const allowed = [
      "name",
      "tastePreferences",
      "dislikes",
      "dietaryRestrictions",
      "cookingLevel",
      "learningMode",
      "onboardingComplete",
      "allergies",
      "householdMembers",
      "voicePreferences",
      "preferences",
      "childrenMode",
    ];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("favorites")
      .select("favorites");
    res.json(user?.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/favorites/:recipeId", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favorites: req.params.recipeId } },
      { new: true },
    ).select("favorites");
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/favorites/:recipeId", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favorites: req.params.recipeId } },
      { new: true },
    ).select("favorites");
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/ai-status", auth, async (req, res) => {
  try {
    const p = getProviderState();
    res.json({
      providerState: p,
      services: [
        {
          key: "gemini",
          label: "Gemini generation",
          configured: p.geminiConfigured,
          detail: p.geminiConfigured
            ? "Model: " + p.geminiModel
            : "Add GEMINI_API_KEY.",
        },
        {
          key: "search",
          label: "Internet recipe search",
          configured: p.searchConfigured,
          detail: p.searchConfigured
            ? "Active: " + p.activeSearchProvider
            : "Add TAVILY_API_KEY.",
        },
        {
          key: "images",
          label: "Recipe images",
          configured: p.imageProvider !== "disabled",
          detail:
            p.imageProvider === "disabled"
              ? "SVG fallback used."
              : "Provider: " + p.imageProvider,
        },
      ],
      readyForFullAiRecipes: p.geminiConfigured && p.searchConfigured,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const totalMeals = await MealHistory.countDocuments({
      userId: req.user.id,
    });
    const recent = await MealHistory.find({ userId: req.user.id })
      .sort({ cookedAt: -1 })
      .limit(10);
    const ratings = recent.map((m) => m.rating).filter(Boolean);
    const avg = ratings.length
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : 0;
    res.json({
      totalMealsCooked: user.totalMealsCooked || totalMeals,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      averageRating: Math.round(avg * 10) / 10,
      achievements: user.achievements || [],
      skillProgression: user.skillProgression || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/household-member", auth, async (req, res) => {
  try {
    const {
      name,
      relationship,
      age,
      dietaryRestrictions,
      allergies,
      dislikes,
      tastePreferences,
    } = req.body;
    const user = await User.findById(req.user.id);
    user.householdMembers.push({
      name,
      relationship,
      age,
      dietaryRestrictions: dietaryRestrictions || [],
      allergies: allergies || [],
      dislikes: dislikes || [],
      tastePreferences: tastePreferences || [],
      isActive: true,
    });
    await user.save();
    res.json(user.householdMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/household-member/:memberId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.householdMembers = user.householdMembers.filter(
      (m) => m._id.toString() !== req.params.memberId,
    );
    await user.save();
    res.json(user.householdMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/update-skill-progression", auth, async (req, res) => {
  try {
    const { technique, levelIncrease } = req.body;
    const user = await User.findById(req.user.id);
    const idx = user.skillProgression.findIndex(
      (s) => s.technique === technique,
    );
    if (idx >= 0) {
      user.skillProgression[idx].level = Math.min(
        100,
        user.skillProgression[idx].level + (levelIncrease || 5),
      );
      user.skillProgression[idx].timesPerformed += 1;
      user.skillProgression[idx].lastPracticed = new Date();
    } else {
      user.skillProgression.push({
        technique,
        level: levelIncrease || 10,
        timesPerformed: 1,
        lastPracticed: new Date(),
      });
    }
    await user.save();
    res.json(user.skillProgression);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/unlock-achievement", auth, async (req, res) => {
  try {
    const { badge, title, description, category } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.achievements.some((a) => a.badge === badge)) {
      user.achievements.push({
        badge,
        title,
        description,
        category,
        unlockedAt: new Date(),
      });
      await user.save();
    }
    res.json(user.achievements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
