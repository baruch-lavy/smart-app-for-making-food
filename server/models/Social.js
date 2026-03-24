const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  review: String,
  photos: [String],
  createdAt: { type: Date, default: Date.now },
  helpful: { type: Number, default: 0 },
  markedHelpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const socialRecipeSchema = new mongoose.Schema({
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  
  ratings: [ratingSchema],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  
  comments: [commentSchema],
  
  communityTips: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    tip: String,
    createdAt: { type: Date, default: Date.now },
    votes: { type: Number, default: 0 }
  }],
  
  sharedCount: { type: Number, default: 0 },
  cookCount: { type: Number, default: 0 },
  
  variations: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    variationTitle: String,
    changesDescription: String,
    photos: [String],
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  
  challengeType: { type: String, enum: ['streak', 'technique', 'cuisine', 'ingredient', 'speed', 'budget'], required: true },
  
  criteria: {
    targetCount: Number,
    targetDays: Number,
    specificTechniques: [String],
    specificCuisines: [String],
    specificIngredients: [String],
    maxTime: Number,
    maxBudget: Number
  },
  
  startDate: Date,
  endDate: Date,
  
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    joinedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  
  rewards: {
    badgeName: String,
    points: Number,
    achievement: String
  },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const followSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followedAt: { type: Date, default: Date.now }
});

const sharedRecipeSchema = new mongoose.Schema({
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  message: String,
  sharedAt: { type: Date, default: Date.now },
  cookedByCount: { type: Number, default: 0 }
});

const SocialRecipe = mongoose.model('SocialRecipe', socialRecipeSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const Follow = mongoose.model('Follow', followSchema);
const SharedRecipe = mongoose.model('SharedRecipe', sharedRecipeSchema);

module.exports = { SocialRecipe, Challenge, Follow, SharedRecipe };
