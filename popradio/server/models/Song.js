const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  artist: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  albumArt: {          
    type: String,
    required: true
  },
  videoUrl: {          
    type: String,
    required: true
  },
  audioUrl: {          
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  genre: [{            
    type: String,
    trim: true
  }],
  releaseYear: {       
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  plays: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: { 
    type: Boolean,
    default: true
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


songSchema.index({ isActive: 1, createdAt: -1 });
songSchema.index({ isActive: 1, likes: -1 });
songSchema.index({ isActive: 1, plays: -1 });
songSchema.index({ genre: 1 });
songSchema.index({ artist: 1 });

module.exports = mongoose.model('Song', songSchema);