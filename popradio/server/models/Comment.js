const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Target (song or playlist)
  targetType: {
    type: String,
    required: true,
    enum: ['song', 'playlist']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  
  // Anonymous user identity
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userFingerprint: {
    type: String
  },
  
  // Content
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  
  // Metadata
  isHidden: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Auto-delete after 30 days (optional)
  expireAt: {
    type: Date,
    expires: 2592000, // 30 days in seconds
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
});

// Compound indexes for efficient queries
commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ sessionId: 1 });
commentSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Comment', commentSchema);