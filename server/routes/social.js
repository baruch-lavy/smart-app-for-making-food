const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  SocialRecipe,
  Challenge,
  Follow,
  SharedRecipe,
} = require("../models/Social");

router.post("/recipe/:recipeId/rate", auth, async (req, res) => {
  try {
    const { rating, review, photos } = req.body;
    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    let socialRecipe = await SocialRecipe.findOne({
      recipeId: req.params.recipeId,
    });

    if (!socialRecipe) {
      socialRecipe = new SocialRecipe({
        recipeId: req.params.recipeId,
        ratings: [],
        comments: [],
      });
    }

    const existingRatingIndex = socialRecipe.ratings.findIndex(
      (r) => r.userId.toString() === req.user.id,
    );

    if (existingRatingIndex >= 0) {
      socialRecipe.ratings[existingRatingIndex].rating = rating;
      socialRecipe.ratings[existingRatingIndex].review = review;
      socialRecipe.ratings[existingRatingIndex].photos = photos || [];
    } else {
      socialRecipe.ratings.push({
        userId: req.user.id,
        userName: user.name,
        rating,
        review,
        photos: photos || [],
      });
    }

    const totalRatings = socialRecipe.ratings.length;
    const sumRatings = socialRecipe.ratings.reduce(
      (sum, r) => sum + r.rating,
      0,
    );
    socialRecipe.averageRating = sumRatings / totalRatings;
    socialRecipe.totalRatings = totalRatings;

    await socialRecipe.save();
    res.json(socialRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/recipe/:recipeId/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    let socialRecipe = await SocialRecipe.findOne({
      recipeId: req.params.recipeId,
    });

    if (!socialRecipe) {
      socialRecipe = new SocialRecipe({
        recipeId: req.params.recipeId,
        ratings: [],
        comments: [],
      });
    }

    socialRecipe.comments.push({
      userId: req.user.id,
      userName: user.name,
      text,
    });

    await socialRecipe.save();
    res.json(socialRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/recipe/:recipeId", auth, async (req, res) => {
  try {
    const socialRecipe = await SocialRecipe.findOne({
      recipeId: req.params.recipeId,
    });
    res.json(
      socialRecipe || {
        recipeId: req.params.recipeId,
        ratings: [],
        comments: [],
      },
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/challenges", auth, async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true }).sort({
      startDate: -1,
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/challenges/:id/join", auth, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const alreadyJoined = challenge.participants.some(
      (p) => p.userId.toString() === req.user.id,
    );

    if (!alreadyJoined) {
      challenge.participants.push({
        userId: req.user.id,
        userName: user.name,
        progress: 0,
        completed: false,
      });

      await challenge.save();
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/share-recipe", auth, async (req, res) => {
  try {
    const { recipeId, sharedWith, message } = req.body;

    const sharedRecipe = new SharedRecipe({
      sharedBy: req.user.id,
      sharedWith,
      recipeId,
      message,
    });

    await sharedRecipe.save();
    res.status(201).json(sharedRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/follow/:userId", auth, async (req, res) => {
  try {
    const existingFollow = await Follow.findOne({
      followerId: req.user.id,
      followingId: req.params.userId,
    });

    if (existingFollow) {
      return res.status(400).json({ error: "Already following this user" });
    }

    const follow = new Follow({
      followerId: req.user.id,
      followingId: req.params.userId,
    });

    await follow.save();
    res.status(201).json(follow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/following", auth, async (req, res) => {
  try {
    const following = await Follow.find({ followerId: req.user.id }).populate(
      "followingId",
      "name email",
    );
    res.json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/community-tips", auth, async (req, res) => {
  try {
    const socialRecipes = await SocialRecipe.find(
      { "communityTips.0": { $exists: true } },
      { communityTips: 1, recipeId: 1 },
    )
      .sort({ updatedAt: -1 })
      .limit(20);

    const tips = [];
    socialRecipes.forEach((sr) => {
      sr.communityTips.forEach((t) => {
        tips.push({
          _id: t._id,
          author: t.userName,
          tip: t.tip,
          likes: t.votes || 0,
          createdAt: t.createdAt,
          recipeId: sr.recipeId,
        });
      });
    });
    tips.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (tips.length === 0) {
      return res.json([
        {
          _id: "default-1",
          author: "Chef Maria",
          tip: "Always let your steak rest for 5 minutes after cooking. The juices redistribute and make it juicier!",
          likes: 42,
          emoji: "🥩",
        },
        {
          _id: "default-2",
          author: "Jamie Home",
          tip: "Add a pinch of sugar to your tomato sauce. It cuts the acidity and balances the flavor perfectly.",
          likes: 38,
          emoji: "🍅",
        },
        {
          _id: "default-3",
          author: "Sarah K.",
          tip: "Freeze leftover herbs in olive oil using ice cube trays. Perfect flavor bombs for future cooking!",
          likes: 27,
          emoji: "🌿",
        },
        {
          _id: "default-4",
          author: "Mike Chen",
          tip: "Toast your spices in a dry pan before using them. It brings out incredible depth of flavor.",
          likes: 55,
          emoji: "🌶️",
        },
      ]);
    }
    res.json(tips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/community-tips", auth, async (req, res) => {
  try {
    const { tip, recipeId } = req.body;
    if (!tip || !tip.trim())
      return res.status(400).json({ error: "Tip text is required" });

    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    let targetRecipeId = recipeId;
    if (!targetRecipeId) {
      let socialRecipe = await SocialRecipe.findOne({}).sort({ updatedAt: -1 });
      if (!socialRecipe) {
        socialRecipe = new SocialRecipe({
          recipeId: new require("mongoose").Types.ObjectId(),
          ratings: [],
          comments: [],
          communityTips: [],
        });
      }
      targetRecipeId = socialRecipe.recipeId;
    }

    let socialRecipe = await SocialRecipe.findOne({ recipeId: targetRecipeId });
    if (!socialRecipe) {
      socialRecipe = new SocialRecipe({
        recipeId: targetRecipeId,
        ratings: [],
        comments: [],
        communityTips: [],
      });
    }

    socialRecipe.communityTips.push({
      userId: req.user.id,
      userName: user?.name || "Anonymous",
      tip: tip.trim(),
      votes: 0,
    });

    await socialRecipe.save();
    res
      .status(201)
      .json(socialRecipe.communityTips[socialRecipe.communityTips.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/community-tips/:tipId/like", auth, async (req, res) => {
  try {
    const socialRecipe = await SocialRecipe.findOne({
      "communityTips._id": req.params.tipId,
    });
    if (!socialRecipe) return res.status(404).json({ error: "Tip not found" });

    const tip = socialRecipe.communityTips.id(req.params.tipId);
    tip.votes = (tip.votes || 0) + 1;
    await socialRecipe.save();
    res.json(tip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/leaderboard", auth, async (req, res) => {
  try {
    const User = require("../models/User");
    const topUsers = await User.find({}, "name totalMealsCooked currentStreak")
      .sort({ totalMealsCooked: -1 })
      .limit(10);

    const currentUser = await User.findById(
      req.user.id,
      "name totalMealsCooked currentStreak",
    );

    const leaderboard = topUsers.map((u, i) => ({
      rank: i + 1,
      name: u._id.toString() === req.user.id ? "You" : u.name,
      meals: u.totalMealsCooked || 0,
      streak: u.currentStreak || 0,
      isCurrentUser: u._id.toString() === req.user.id,
      badge: i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1),
    }));

    const isInTop = leaderboard.some((e) => e.isCurrentUser);
    if (!isInTop && currentUser) {
      leaderboard.push({
        rank: "—",
        name: "You",
        meals: currentUser.totalMealsCooked || 0,
        streak: currentUser.currentStreak || 0,
        isCurrentUser: true,
        badge: "⭐",
      });
    }

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
