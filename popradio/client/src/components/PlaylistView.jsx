import { motion } from 'framer-motion';

function PlaylistView({ playlist, onBack, onLike, onUnlike, onOpenComments }) {
  const handleToggleLike = () => {
    if (playlist.isLikedByUser) {
      onUnlike(playlist._id);
    } else {
      onLike(playlist._id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        className="action-btn"
        onClick={onBack}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ marginBottom: '20px', maxWidth: '120px' }}
      >
        ← Back
      </motion.button>

      <div className="now-playing-card">
        <div className="album-art-container">
          <img src={playlist.coverImage} alt={playlist.title} className="album-art" />
        </div>

        <div className="song-info">
          <h2 className="song-title">{playlist.title}</h2>
          {playlist.description && (
            <p className="song-artist">{playlist.description}</p>
          )}
          <div className="song-stats">
            <span>💕 {playlist.likes}</span>
            <span>👁️ {playlist.views}</span>
            <span>🎵 {playlist.songs?.length || 0} songs</span>
          </div>
        </div>

        <div className="song-actions">
          <motion.button
            className={`action-btn ${playlist.isLikedByUser ? 'liked' : ''}`}
            onClick={handleToggleLike}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {playlist.isLikedByUser ? '💖' : '🤍'} Like
          </motion.button>
          <motion.button
            className="action-btn"
            onClick={onOpenComments}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💬 Chat
          </motion.button>
        </div>
      </div>

      {playlist.songs && playlist.songs.length > 0 && (
        <div className="queue-section" style={{ marginTop: '24px' }}>
          <h2 className="section-title">
            <span>🎶</span> Songs in this playlist
          </h2>
          <div className="queue-list">
            {playlist.songs.map((song, index) => (
              <motion.div
                key={song._id}
                className="queue-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
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
  );
}

export default PlaylistView;