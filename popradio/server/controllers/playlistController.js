const Playlist = require('../models/Playlist');
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

// Get all playlists
exports.getPlaylists = async (req, res) => {
  try {
    const { page = 1, limit = 20, featured } = req.query;
    
    const query = { isActive: true };
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);
    
    const [playlists, total] = await Promise.all([
      Playlist.find(query)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(maxLimit)
        .populate('songs', 'title artist albumArt duration')
        .lean(),
      Playlist.countDocuments(query)
    ]);
    
    // Enrich with Redis data
    const { sessionId } = req;
    const enrichedPlaylists = await Promise.all(
      playlists.map(async (playlist) => {
        const likes = await getCounter(`playlist:${playlist._id}:likes`);
        const views = await getCounter(`playlist:${playlist._id}:views`);
        const isLikedByUser = await hasUserLiked(sessionId, 'playlist', playlist._id.toString());
        
        return {
          ...playlist,
          likes: likes || playlist.likes,
          views: views || playlist.views,
          isLikedByUser: Boolean(isLikedByUser)
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        playlists: enrichedPlaylists,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / maxLimit),
          totalPlaylists: total,
          hasNext: skip + enrichedPlaylists.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch playlists'
    });
  }
};

// Get single playlist by ID
exports.getPlaylistById = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { sessionId } = req;
    
    const playlist = await Playlist.findOne({ _id: playlistId, isActive: true })
      .populate('songs')
      .lean();
    
    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }
    
    // Increment view count
    await incrementCounter(`playlist:${playlistId}:views`);
    
    // Get real-time data
    const likes = await getCounter(`playlist:${playlistId}:likes`);
    const views = await getCounter(`playlist:${playlistId}:views`);
    const isLikedByUser = await hasUserLiked(sessionId, 'playlist', playlistId);
    
    res.json({
      success: true,
      data: {
        ...playlist,
        likes: likes || playlist.likes,
        views: views || playlist.views,
        isLikedByUser: Boolean(isLikedByUser)
      }
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch playlist'
    });
  }
};

// Like a playlist
exports.likePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { sessionId } = req;
    
    const playlist = await Playlist.findOne({ _id: playlistId, isActive: true });
    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }
    
    const alreadyLiked = await hasUserLiked(sessionId, 'playlist', playlistId);
    if (alreadyLiked) {
      return res.status(409).json({
        success: false,
        error: "You've already liked this playlist"
      });
    }
    
    const newLikeCount = await incrementCounter(`playlist:${playlistId}:likes`);
    await addUserLike(sessionId, 'playlist', playlistId);
    
    res.json({
      success: true,
      data: {
        playlistId,
        likes: newLikeCount,
        isLiked: true
      }
    });
  } catch (error) {
    console.error('Like playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like playlist'
    });
  }
};

// Unlike a playlist
exports.unlikePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { sessionId } = req;
    
    const isLiked = await hasUserLiked(sessionId, 'playlist', playlistId);
    if (!isLiked) {
      return res.status(404).json({
        success: false,
        error: "You haven't liked this playlist"
      });
    }
    
    const newLikeCount = await decrementCounter(`playlist:${playlistId}:likes`);
    await removeUserLike(sessionId, 'playlist', playlistId);
    
    res.json({
      success: true,
      data: {
        playlistId,
        likes: Math.max(0, newLikeCount),
        isLiked: false
      }
    });
  } catch (error) {
    console.error('Unlike playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike playlist'
    });
  }
};

// Get comments for a playlist
exports.getPlaylistComments = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { cursor, limit = 20 } = req.query;
    
    const query = {
      targetType: 'playlist',
      targetId: playlistId,
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

// Add comment to playlist
exports.addPlaylistComment = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { text } = req.body;
    const { sessionId } = req;
    
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
    
    const playlist = await Playlist.findOne({ _id: playlistId, isActive: true });
    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }
    
    const comment = new Comment({
      targetType: 'playlist',
      targetId: playlistId,
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

// Get featured playlists (cached)
exports.getFeaturedPlaylists = async (req, res) => {
  try {
    const cacheKey = 'cache:playlists:featured';
    const cached = await getCached(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    const playlists = await Playlist.find({ isActive: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .populate('songs', 'title artist albumArt')
      .lean();
    
    const { sessionId } = req;
    const enrichedPlaylists = await Promise.all(
      playlists.map(async (playlist) => {
        const likes = await getCounter(`playlist:${playlist._id}:likes`);
        const views = await getCounter(`playlist:${playlist._id}:views`);
        const isLikedByUser = await hasUserLiked(sessionId, 'playlist', playlist._id.toString());
        
        return {
          ...playlist,
          likes: likes || playlist.likes,
          views: views || playlist.views,
          isLikedByUser: Boolean(isLikedByUser)
        };
      })
    );
    
    const result = { playlists: enrichedPlaylists };
    await setCached(cacheKey, result, 600); // 10 minute cache
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get featured playlists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured playlists'
    });
  }
};