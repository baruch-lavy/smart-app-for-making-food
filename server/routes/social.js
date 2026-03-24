const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { SocialRecipe, Challenge, Follow, SharedRecipe } = require('../models/Social');

router.post('/recipe/:recipeId/rate', auth, async (req, res) => {
  try {
    const { rating, review, photos } = req.body;
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    let socialRecipe = await SocialRecipe.findOne({ recipeId: req.params.recipeId });
    
    if (!socialRecipe) {
      socialRecipe = new SocialRecipe({
        recipeId: req.params.recipeId,
        ratings: [],
        comments: []
      });
    }
    
    const existingRatingIndex = socialRecipe.ratings.findIndex(
      r => r.userId.toString() === req.userId
    );
    
    if (existingRatingIndex >= 0) {
      socialRecipe.ratings[existingRatingIndex].rating = rating;
      socialRecipe.ratings[existingRatingIndex].review = review;
      socialRecipe.ratings[existingRatingIndex].photos = photos || [];
    } else {
      socialRecipe.ratings.push({
        userId: req.userId,
        userName: user.name,
        rating,
        review,
        photos: photos || []
      });
    }
    
    const totalRatings = socialRecipe.ratings.length;
    const sumRatings = socialRecipe.ratings.reduce((sum, r) => sum + r.rating, 0);
    socialRecipe.averageRating = sumRatings / totalRatings;
    socialRecipe.totalRatings = totalRatings;
    
    await socialRecipe.save();
    res.json(socialRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recipe/:recipeId/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    let socialRecipe = await SocialRecipe.findOne({ recipeId: req.params.recipeId });
    
    if (!socialRecipe) {
      socialRecipe = new SocialRecipe({
        recipeId: req.params.recipeId,
        ratings: [],
        comments: []
      });
    }
    
    socialRecipe.comments.push({
      userId: req.userId,
      userName: user.name,
      text
    });
    
    await socialRecipe.save();
    res.json(socialRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recipe/:recipeId', auth, async (req, res) => {
  try {
    const socialRecipe = await SocialRecipe.findOne({ recipeId: req.params.recipeId });
    res.json(socialRecipe || { recipeId: req.params.recipeId, ratings: [], comments: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/challenges', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true }).sort({ startDate: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/challenges/:id/join', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    const alreadyJoined = challenge.participants.some(
      p => p.userId.toString() === req.userId
    );
    
    if (!alreadyJoined) {
      challenge.participants.push({
        userId: req.userId,
        userName: user.name,
        progress: 0,
        completed: false
      });
      
      await challenge.save();
    }
    
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/share-recipe', auth, async (req, res) => {
  try {
    const { recipeId, sharedWith, message } = req.body;
    
    const sharedRecipe = new SharedRecipe({
      sharedBy: req.userId,
      sharedWith,
      recipeId,
      message
    });
    
    await sharedRecipe.save();
    res.status(201).json(sharedRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const existingFollow = await Follow.findOne({
      followerId: req.userId,
      followingId: req.params.userId
    });
    
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    const follow = new Follow({
      followerId: req.userId,
      followingId: req.params.userId
    });
    
    await follow.save();
    res.status(201).json(follow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/following', auth, async (req, res) => {
  try {
    const following = await Follow.find({ followerId: req.userId }).populate('followingId', 'name email');
    res.json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
