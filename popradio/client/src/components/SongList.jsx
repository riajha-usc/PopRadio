import { motion } from 'framer-motion';

function SongList({ songs, onSelectSong }) {
  return (
    <div className="playlists-grid">
      <h2 className="section-title">
        <span>🎵</span> All Songs
      </h2>
      <div className="queue-list" style={{ marginTop: '20px' }}>
        {songs.map((song, index) => (
          <motion.div
            key={song._id}
            className="queue-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectSong && onSelectSong(song)}
            style={{ cursor: 'pointer' }}
          >
            <img src={song.albumArt} alt={song.title} className="queue-thumb" />
            <div className="queue-info">
              <p className="queue-title">{song.title}</p>
              <p className="queue-artist">{song.artist}</p>
              <div className="song-stats" style={{ marginTop: '6px', fontSize: '12px' }}>
                <span>💕 {song.likes}</span>
                <span>▶️ {song.plays}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SongList;