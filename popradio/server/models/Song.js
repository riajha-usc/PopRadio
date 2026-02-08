const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  title: String,
  artist: String,
  url: String,
  duration: Number,
  likes: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Song", SongSchema);
