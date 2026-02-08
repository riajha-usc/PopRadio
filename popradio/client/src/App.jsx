import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import api from './api';
import NowPlaying from './components/NowPlaying';
import PlaylistView from './components/PlaylistView';
import SongList from './components/SongList';
import Comments from './components/Comments';

function App() {
  const [currentView, setCurrentView] = useState('radio'); // 'radio', 'playlists', 'songs'
  const [nowPlaying, setNowPlaying] = useState(null);
  const [queue, setQueue] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch radio stream
  useEffect(() => {
    fetchRadioStream();
    const interval = setInterval(fetchRadioStream, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch playlists
  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchRadioStream = async () => {
    try {
      const data = await api.getRadioStream();
      setNowPlaying(data.nowPlaying);
      setQueue(data.queue);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch radio stream:', error);
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const data = await api.getPlaylists();
      setPlaylists(data.playlists);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const fetchSongs = async () => {
    try {
      const data = await api.getSongs();
      setSongs(data.songs);
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    }
  };

  const handleLikeSong = async (songId) => {
    try {
      await api.likeSong(songId);
      fetchRadioStream();
      if (songs.length > 0) fetchSongs();
    } catch (error) {
      console.error('Failed to like song:', error);
    }
  };

  const handleUnlikeSong = async (songId) => {
    try {
      await api.unlikeSong(songId);
      fetchRadioStream();
      if (songs.length > 0) fetchSongs();
    } catch (error) {
      console.error('Failed to unlike song:', error);
    }
  };

  const handleLikePlaylist = async (playlistId) => {
    try {
      await api.likePlaylist(playlistId);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to like playlist:', error);
    }
  };

  const handleUnlikePlaylist = async (playlistId) => {
    try {
      await api.unlikePlaylist(playlistId);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to unlike playlist:', error);
    }
  };

  const openComments = (type, target) => {
    setCommentTarget({ type, target });
    setShowComments(true);
  };

  const closeComments = () => {
    setShowComments(false);
    setCommentTarget(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <motion.div
            className="loading-heart"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            💕
          </motion.div>
          <p className="loading-text">Loading your dreamy radio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Floating decorations */}
      <div className="decorations">
        <div className="star star-1">✨</div>
        <div className="star star-2">⭐</div>
        <div className="star star-3">💫</div>
        <div className="heart heart-1">💕</div>
        <div className="heart heart-2">💖</div>
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
      </div>

      {/* Header */}
      <header className="header">
        <motion.h1
          className="logo"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="logo-icon">🎵</span>
          PopRadio
          <span className="logo-sparkle">✨</span>
        </motion.h1>
        <p className="tagline">your dreamy music station</p>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <motion.button
          className={`nav-btn ${currentView === 'radio' ? 'active' : ''}`}
          onClick={() => setCurrentView('radio')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Radio
        </motion.button>
        <motion.button
          className={`nav-btn ${currentView === 'playlists' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('playlists');
            if (playlists.length === 0) fetchPlaylists();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Playlists
        </motion.button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {currentView === 'radio' && nowPlaying && (
            <motion.div
              key="radio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NowPlaying
                song={nowPlaying}
                onLike={handleLikeSong}
                onUnlike={handleUnlikeSong}
                onOpenComments={() => openComments('song', nowPlaying)}
              />
              
              {queue.length > 0 && (
                <div className="queue-section">
                  <h2 className="section-title">
                    <span>🎶</span> Up Next
                  </h2>
                  <div className="queue-list">
                    {queue.map((song, index) => (
                      <motion.div
                        key={song._id}
                        className="queue-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <img src={song.albumArt} alt={song.title} className="queue-thumb" />
                        <div className="queue-info">
                          <p className="queue-title">{song.title}</p>
                          <p className="queue-artist">{song.artist}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'playlists' && (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedPlaylist ? (
                <PlaylistView
                  playlist={selectedPlaylist}
                  onBack={() => setSelectedPlaylist(null)}
                  onLike={handleLikePlaylist}
                  onUnlike={handleUnlikePlaylist}
                  onOpenComments={() => openComments('playlist', selectedPlaylist)}
                />
              ) : (
                <div className="playlists-grid">
                  <h2 className="section-title">
                    <span>💖</span> Curated Playlists
                  </h2>
                  <div className="playlist-cards">
                    {playlists.map((playlist, index) => (
                      <motion.div
                        key={playlist._id}
                        className="playlist-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => setSelectedPlaylist(playlist)}
                      >
                        <img src={playlist.coverImage} alt={playlist.title} className="playlist-cover" />
                        <div className="playlist-info">
                          <h3 className="playlist-title">{playlist.title}</h3>
                          <p className="playlist-meta">{playlist.songs?.length || 0} songs</p>
                          <div className="playlist-stats">
                            <span>💕 {playlist.likes}</span>
                            <span>👁️ {playlist.views}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && commentTarget && (
          <Comments
            targetType={commentTarget.type}
            target={commentTarget.target}
            onClose={closeComments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;