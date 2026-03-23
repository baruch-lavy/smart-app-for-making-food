const mongoose = require('mongoose');

const techniqueSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, enum: ['knife-skills', 'cooking-methods', 'baking', 'prep', 'plating', 'sauce-making', 'seasoning'], required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  
  description: String,
  
  videoUrl: String,
  imageUrls: [String],
  
  steps: [String],
  
  commonMistakes: [String],
  proTips: [String],
  
  estimatedTimeToLearn: Number,
  
  relatedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  
  prerequisiteTechniques: [String]
}, { timestamps: true });

const chefNoteSchema = new mongoose.Schema({
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  stepNumber: Number,
  
  noteType: { type: String, enum: ['why-it-matters', 'pro-tip', 'common-mistake', 'science-behind', 'alternative-method'], required: true },
  
  title: String,
  content: { type: String, required: true },
  
  difficultyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  
  author: { type: String, default: 'Chef AI' },
  
  votes: { type: Number, default: 0 }
}, { timestamps: true });

const learningPathSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  
  techniquesCompleted: [{
    techniqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technique' },
    techniqueName: String,
    completedAt: Date,
    masteryLevel: { type: Number, min: 0, max: 100, default: 0 },
    timesPerformed: { type: Number, default: 0 }
  }],
  
  currentLearningGoals: [{
    goal: String,
    targetDate: Date,
    progress: { type: Number, min: 0, max: 100, default: 0 },
    relatedTechniques: [String]
  }],
  
  weakAreas: [String],
  strengthAreas: [String],
  
  suggestedNextTechniques: [String],
  
  quizScores: [{
    techniqueId: String,
    score: Number,
    takenAt: Date
  }],
  
  certifications: [{
    certificationType: { type: String, enum: ['beginner-chef', 'home-cook-pro', 'cuisine-master', 'technique-specialist', 'master-chef'] },
    title: String,
    awardedAt: Date,
    criteria: String
  }]
}, { timestamps: true });

const Technique = mongoose.model('Technique', techniqueSchema);
const ChefNote = mongoose.model('ChefNote', chefNoteSchema);
const LearningPath = mongoose.model('LearningPath', learningPathSchema);

module.exports = { Technique, ChefNote, LearningPath };
