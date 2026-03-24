const mongoose = require('mongoose');

const musicPreferenceSchema = new mongoose.Schema({
  moodType: { type: String, enum: ['calm', 'upbeat', 'focus', 'energetic', 'romantic', 'party'], required: true },
  genre: String,
  playlistUrl: String,
  volume: { type: Number, min: 0, max: 100, default: 50 }
});

const experienceSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  
  sessionStartedAt: { type: Date, default: Date.now },
  sessionEndedAt: Date,
  
  musicSettings: {
    enabled: { type: Boolean, default: false },
    selectedMood: String,
    selectedPlaylist: String,
    adaptiveMode: { type: Boolean, default: true }
  },
  
  ambianceSettings: {
    enabled: { type: Boolean, default: false },
    soundscape: { type: String, enum: ['nature', 'cafe', 'kitchen-sounds', 'rain', 'fireplace', 'ocean', 'forest'], default: 'nature' },
    volume: { type: Number, min: 0, max: 100, default: 30 }
  },
  
  podcastAudiobookSettings: {
    enabled: { type: Boolean, default: false },
    contentType: { type: String, enum: ['podcast', 'audiobook', 'none'], default: 'none' },
    contentUrl: String,
    pauseOnTimer: { type: Boolean, default: true }
  },
  
  socialCooking: {
    enabled: { type: Boolean, default: false },
    sessionType: { type: String, enum: ['video-call', 'shared-recipe', 'cooking-party'], default: 'video-call' },
    participants: [{ userId: String, name: String, status: String }],
    roomCode: String
  },
  
  chefCommentary: {
    enabled: { type: Boolean, default: false },
    commentaryStyle: { type: String, enum: ['gordon-ramsay', 'supportive', 'educational', 'funny', 'motivational'], default: 'supportive' }
  },
  
  sessionRating: { type: Number, min: 1, max: 5 },
  experienceFeedback: String
}, { timestamps: true });

const userExperiencePreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  defaultMusicPreferences: [musicPreferenceSchema],
  
  defaultAmbiance: String,
  
  enableMusicByDefault: { type: Boolean, default: false },
  enableAmbianceByDefault: { type: Boolean, default: false },
  
  favoriteExperienceModes: [String]
}, { timestamps: true });

const ExperienceSession = mongoose.model('ExperienceSession', experienceSessionSchema);
const UserExperiencePreferences = mongoose.model('UserExperiencePreferences', userExperiencePreferencesSchema);

module.exports = { ExperienceSession, UserExperiencePreferences };
