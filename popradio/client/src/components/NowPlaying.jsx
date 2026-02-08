import { motion } from 'framer-motion';

function NowPlaying({ song, onLike, onUnlike, onOpenComments }) {
  const handleToggleLike = () => {
    if (song.isLikedByUser) {
      onUnlike(song._id);
    } else {
      onLike(song._id);
    }
  };

  return (
    <motion.div
      className="now-playing-card"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="album-art-container">
        <img src={song.albumArt} alt={song.title} className="album-art" />
        <motion.div
          className="pulse-ring"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="song-info">
        <h2 className="song-title">{song.title}</h2>
        <p className="song-artist">{song.artist}</p>
        <div className="song-stats">
          <span>💕 {song.likes.toLocaleString()}</span>
          <span>▶️ {song.plays.toLocaleString()}</span>
        </div>
      </div>

      <div className="song-actions">
        <motion.button
          className={`action-btn ${song.isLikedByUser ? 'liked' : ''}`}
          onClick={handleToggleLike}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {song.isLikedByUser ? '💖' : '🤍'} Like
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
    </motion.div>
  );
}

export default NowPlaying;