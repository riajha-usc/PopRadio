const Song = require('../models/Song');
const Comment = require('../models/Comment');
const {
  incrementCounter,
  decrementCounter,
  getCounter,
  hasUserLiked,
  addUserLike,
  removeUserLike,
  getCached,
  setCached
} = require('../config/redis');

// Get all songs (paginated)
exports.getSongs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      sort = 'recent'
    } = req.query;
    
    const query = { isActive: true };
    
    if (genre) {
      query.genre = genre;
    }
    
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { likes: -1, plays: -1 };
        break;
      case 'likes':
        sortOption = { likes: -1 };
        break;
      case 'plays':
        sortOption = { plays: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);
    
    const [songs, total] = await Promise.all([
      Song.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(maxLimit)
        .lean(),
      Song.countDocuments(query)
    ]);
    
    // Get real-time like counts from Redis
    const { sessionId } = req;
    const enrichedSongs = await Promise.all(
      songs.map(async (song) => {
        const likes = await getCounter(`song:${song._id}:likes`);
        const plays = await getCounter(`song:${song._id}:plays`);
        const isLikedByUser = await hasUserLiked(sessionId, 'song', song._id.toString());
        
        return {
          ...song,
          likes: likes || song.likes,
          plays: plays || song.plays,
          isLikedByUser: Boolean(isLikedByUser)
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        songs: enrichedSongs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / maxLimit),
          totalSongs: total,
          hasNext: skip + enrichedSongs.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch songs'
    });
  }
};

// Get single song by ID
exports.getSongById = async (req, res) => {
  try {
    const { songId } = req.params;
    const { sessionId } = req;
    
    const song = await Song.findOne({ _id: songId, isActive: true }).lean();
    
    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }
    
    // Get real-time counts from Redis
    const likes = await getCounter(`song:${song._id}:likes`);
    const plays = await getCounter(`song:${song._id}:plays`);
    const isLikedByUser = await hasUserLiked(sessionId, 'song', songId);
    
    res.json({
      success: true,
      data: {
        ...song,
        likes: likes || song.likes,
        plays: plays || song.plays,
        isLikedByUser: Boolean(isLikedByUser)
      }
    });
  } catch (error) {
    console.error('Get song error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch song'
    });
  }
};

// Play a song (increment play count)
exports.playSong = async (req, res) => {
  try {
    const { songId } = req.params;
    
    // Verify song exists
    const song = await Song.findOne({ _id: songId, isActive: true });
    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }
    
    // Atomic increment in Redis
    const newPlayCount = await incrementCounter(`song:${songId}:plays`);
    
    res.json({
      success: true,
      data: {
        songId,
        plays: newPlayCount
      }
    });
  } catch (error) {
    console.error('Play song error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record play'
    });
  }
};

// Like a song
exports.likeSong = async (req, res) => {
  try {
    const { songId } = req.params;
    const { sessionId } = req;
    
    // Verify song exists
    const song = await Song.findOne({ _id: songId, isActive: true });
    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }
    
    // Check if already liked
    const alreadyLiked = await hasUserLiked(sessionId, 'song', songId);
    if (alreadyLiked) {
      return res.status(409).json({
        success: false,
        error: "You've already liked this song"
      });
    }
    
    // Atomic operations
    const newLikeCount = await incrementCounter(`song:${songId}:likes`);
    await addUserLike(sessionId, 'song', songId);
    
    res.json({
      success: true,
      data: {
        songId,
        likes: newLikeCount,
        isLiked: true
      }
    });
  } catch (error) {
    console.error('Like song error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like song'
    });
  }
};

// Unlike a song
exports.unlikeSong = async (req, res) => {
  try {
    const { songId } = req.params;
    const { sessionId } = req;
    
    // Check if liked
    const isLiked = await hasUserLiked(sessionId, 'song', songId);
    if (!isLiked) {
      return res.status(404).json({
        success: false,
        error: "You haven't liked this song"
      });
    }
    
    // Atomic operations
    const newLikeCount = await decrementCounter(`song:${songId}:likes`);
    await removeUserLike(sessionId, 'song', songId);
    
    res.json({
      success: true,
      data: {
        songId,
        likes: Math.max(0, newLikeCount), // Prevent negative
        isLiked: false
      }
    });
  } catch (error) {
    console.error('Unlike song error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike song'
    });
  }
};

// Get comments for a song
exports.getSongComments = async (req, res) => {
  try {
    const { songId } = req.params;
    const { cursor, limit = 20 } = req.query;
    
    const query = {
      targetType: 'song',
      targetId: songId,
      isHidden: false
    };
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const comments = await Comment.find(query)
      .sort({ _id: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: {
        comments,
        nextCursor: comments.length === parseInt(limit)
          ? comments[comments.length - 1]._id
          : null
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
};

// Add comment to song
exports.addSongComment = async (req, res) => {
  try {
    const { songId } = req.params;
    const { text } = req.body;
    const { sessionId } = req;
    
    // Validate text
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }
    
    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be 500 characters or less'
      });
    }
    
    // Verify song exists
    const song = await Song.findOne({ _id: songId, isActive: true });
    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }
    
    // Create comment
    const comment = new Comment({
      targetType: 'song',
      targetId: songId,
      sessionId,
      text: text.trim()
    });
    
    await comment.save();
    
    res.status(201).json({
      success: true,
      data: {
        comment: comment.toObject()
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
};

// Get popular songs (cached)
exports.getPopularSongs = async (req, res) => {
  try {
    const cacheKey = 'cache:songs:popular';
    const cached = await getCached(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    const songs = await Song.find({ isActive: true })
      .sort({ likes: -1, plays: -1 })
      .limit(50)
      .lean();
    
    // Enrich with Redis data
    const { sessionId } = req;
    const enrichedSongs = await Promise.all(
      songs.map(async (song) => {
        const likes = await getCounter(`song:${song._id}:likes`);
        const plays = await getCounter(`song:${song._id}:plays`);
        const isLikedByUser = await hasUserLiked(sessionId, 'song', song._id.toString());
        
        return {
          ...song,
          likes: likes || song.likes,
          plays: plays || song.plays,
          isLikedByUser: Boolean(isLikedByUser)
        };
      })
    );
    
    const result = { songs: enrichedSongs };
    await setCached(cacheKey, result, 300); // 5 minute cache
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get popular songs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular songs'
    });
  }
};