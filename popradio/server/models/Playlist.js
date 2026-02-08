const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  coverImage: {
    type: String,
    required: true
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  
  // Synced from Redis
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
playlistSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
playlistSchema.index({ isActive: 1, likes: -1 });

// Virtual for song count
playlistSchema.virtual('songCount').get(function() {
  return this.songs.length;
});

module.exports = mongoose.model('Playlist', playlistSchema);