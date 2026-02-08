const Song = require('../models/Song');
const Playlist = require('../models/Playlist');
const { getCounter, hasUserLiked } = require('../config/redis');

// Radio state (in-memory for simplicity, could use Redis for distributed systems)
let radioState = {
  currentSong: null,
  queue: [],
  startedAt: null,
  playlistId: null
};

// Initialize radio on server start
async function initializeRadio() {
  try {
    // Get a featured playlist or random songs
    const playlist = await Playlist.findOne({ isActive: true, isFeatured: true })
      .populate('songs');
    
    if (playlist && playlist.songs.length > 0) {
      radioState.queue = playlist.songs;
      radioState.playlistId = playlist._id;
    } else {
      // Fallback to random songs
      const songs = await Song.find({ isActive: true }).limit(20);
      radioState.queue = songs;
    }
    
    if (radioState.queue.length > 0) {
      playNextSong();
    }
    
    console.log('✅ Radio initialized with', radioState.queue.length, 'songs');
  } catch (error) {
    console.error('❌ Failed to initialize radio:', error);
  }
}

// Play next song in queue
function playNextSong() {
  if (radioState.queue.length === 0) {
    console.warn('⚠️ Radio queue is empty');
    return;
  }
  
  radioState.currentSong = radioState.queue.shift();
  radioState.startedAt = new Date();
  
  // Add song back to end of queue (loop)
  radioState.queue.push(radioState.currentSong);
  
  // Schedule next song
  const duration = radioState.currentSong.duration * 1000; // Convert to ms
  setTimeout(() => {
    playNextSong();
  }, duration);
  
  console.log('🎵 Now playing:', radioState.currentSong.title);
}

// Get current radio stream
exports.getRadioStream = async (req, res) => {
  try {
    const { sessionId } = req;
    
    if (!radioState.currentSong) {
      await initializeRadio();
    }
    
    // Enrich current song with Redis data
    const songId = radioState.currentSong._id.toString();
    const likes = await getCounter(`song:${songId}:likes`);
    const plays = await getCounter(`song:${songId}:plays`);
    const isLikedByUser = await hasUserLiked(sessionId, 'song', songId);
    
    const nowPlaying = {
      ...radioState.currentSong.toObject ? radioState.currentSong.toObject() : radioState.currentSong,
      likes: likes || radioState.currentSong.likes,
      plays: plays || radioState.currentSong.plays,
      isLikedByUser: Boolean(isLikedByUser),
      startedAt: radioState.startedAt,
      endsAt: new Date(radioState.startedAt.getTime() + radioState.currentSong.duration * 1000)
    };
    
    // Get next 5 songs in queue
    const queuePreview = radioState.queue.slice(0, 5).map(song => ({
      _id: song._id,
      title: song.title,
      artist: song.artist,
      albumArt: song.albumArt,
      duration: song.duration
    }));
    
    res.json({
      success: true,
      data: {
        nowPlaying,
        queue: queuePreview,
        playlistId: radioState.playlistId
      }
    });
  } catch (error) {
    console.error('Get radio stream error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch radio stream'
    });
  }
};

// Skip to next song (optional feature)
exports.skipToNext = async (req, res) => {
  try {
    playNextSong();
    
    res.json({
      success: true,
      data: {
        message: 'Skipped to next song',
        nowPlaying: {
          _id: radioState.currentSong._id,
          title: radioState.currentSong.title,
          artist: radioState.currentSong.artist
        }
      }
    });
  } catch (error) {
    console.error('Skip song error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to skip song'
    });
  }
};

module.exports.initializeRadio = initializeRadio;