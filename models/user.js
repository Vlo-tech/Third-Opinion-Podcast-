// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  name:     { type: String },
  photoUrl: { type: String },
  joinedAt: { type: Date, default: Date.now },

  // Podcast‐specific fields:
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode',
    }
  ],

  subscriptionTier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },

  listenedEpisodes: [
    {
      episode:    { type: mongoose.Schema.Types.ObjectId, ref: 'Episode' },
      listenedAt: { type: Date, default: Date.now }
    }
  ],

  notifyOnNewEpisode: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
