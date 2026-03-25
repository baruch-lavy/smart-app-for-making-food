const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Technique, ChefNote, LearningPath } = require("../models/Learning");

router.get("/techniques", auth, async (req, res) => {
  try {
    const techniques = await Technique.find({}).sort({
      category: 1,
      difficulty: 1,
    });
    res.json(techniques);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/techniques/:id", auth, async (req, res) => {
  try {
    const technique = await Technique.findById(req.params.id).populate(
      "relatedRecipes",
    );
    res.json(technique);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/chef-notes/recipe/:recipeId", auth, async (req, res) => {
  try {
    const notes = await ChefNote.find({ recipeId: req.params.recipeId }).sort({
      stepNumber: 1,
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/path", auth, async (req, res) => {
  try {
    let learningPath = await LearningPath.findOne({ userId: req.user.id });

    if (!learningPath) {
      learningPath = new LearningPath({
        userId: req.user.id,
        currentLevel: "beginner",
        techniquesCompleted: [],
      });
      await learningPath.save();
    }

    res.json(learningPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/path/complete-technique", auth, async (req, res) => {
  try {
    const { techniqueId, techniqueName } = req.body;

    let learningPath = await LearningPath.findOne({ userId: req.user.id });

    if (!learningPath) {
      learningPath = new LearningPath({ userId: req.user.id });
    }

    const existingIndex = learningPath.techniquesCompleted.findIndex(
      (t) => t.techniqueId?.toString() === techniqueId,
    );

    if (existingIndex >= 0) {
      learningPath.techniquesCompleted[existingIndex].timesPerformed += 1;
      learningPath.techniquesCompleted[existingIndex].masteryLevel = Math.min(
        100,
        learningPath.techniquesCompleted[existingIndex].masteryLevel + 10,
      );
    } else {
      learningPath.techniquesCompleted.push({
        techniqueId,
        techniqueName,
        completedAt: new Date(),
        masteryLevel: 20,
        timesPerformed: 1,
      });
    }

    await learningPath.save();
    res.json(learningPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/path/award-certification", auth, async (req, res) => {
  try {
    const { certificationType, title, criteria } = req.body;

    let learningPath = await LearningPath.findOne({ userId: req.user.id });

    if (!learningPath) {
      learningPath = new LearningPath({ userId: req.user.id });
    }

    learningPath.certifications.push({
      certificationType,
      title,
      awardedAt: new Date(),
      criteria,
    });

    await learningPath.save();
    res.json(learningPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
