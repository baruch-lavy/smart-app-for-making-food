const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const householdMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, enum: ['self', 'spouse', 'partner', 'child', 'parent', 'roommate', 'other'], default: 'other' },
  age: Number,
  dietaryRestrictions: [String],
  allergies: [String],
  dislikes: [String],
  tastePreferences: [String],
  isActive: { type: Boolean, default: true }
});

const skillProgressionSchema = new mongoose.Schema({
  technique: { type: String, required: true },
  level: { type: Number, default: 0, min: 0, max: 100 },
  lastPracticed: Date,
  timesPerformed: { type: Number, default: 0 }
});

const achievementSchema = new mongoose.Schema({
  badge: { type: String, required: true },
  title: String,
  description: String,
  unlockedAt: { type: Date, default: Date.now },
  category: { type: String, enum: ['cooking', 'learning', 'consistency', 'exploration', 'mastery'] }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cookingLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  tastePreferences: [String],
  dislikes: [String],
  dietaryRestrictions: [String],
  allergies: [String],
  learningMode: { type: Boolean, default: false },
  onboardingComplete: { type: Boolean, default: false },
  
  householdMembers: [householdMemberSchema],
  
  skillProgression: [skillProgressionSchema],
  achievements: [achievementSchema],
  totalMealsCooked: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCookedDate: Date,
  
  voicePreferences: {
    enabled: { type: Boolean, default: false },
    language: { type: String, default: 'en-US' },
    speed: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
    voiceType: { type: String, enum: ['male', 'female', 'neutral'], default: 'neutral' }
  },
  
  aiDietaryProfile: {
    autoDetectedAllergies: [String],
    autoDetectedRestrictions: [String],
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: Date
  },
  
  preferences: {
    cookingGoals: [{ type: String, enum: ['learn-basics', 'save-time', 'eat-healthy', 'impress-others', 'save-money', 'reduce-waste'] }],
    energyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    typicalCookingTime: { type: String, enum: ['quick', 'moderate', 'relaxed'], default: 'moderate' },
    mealComplexityPreference: { type: String, enum: ['simple', 'moderate', 'complex'], default: 'moderate' }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
