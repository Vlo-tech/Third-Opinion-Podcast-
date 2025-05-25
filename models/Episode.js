// models/Episode.js

const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  episodeNumber: { type: Number, required: true, unique: true },
  title:         { type: String, required: true },
  summary:       { type: String, required: true },
  thumbnail:     { type: String, required: true },
  audioUrl:      { type: String, required: true }
});

// If an "Episode" model already exists, use it.
// Otherwise, register a new one now.
module.exports =
  mongoose.models.Episode ||
  mongoose.model('Episode', episodeSchema);
