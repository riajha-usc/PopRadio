const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const rateLimiters = require('../middleware/rateLimiter');

// GET /api/songs - Get all songs (paginated)
router.get('/', songController.getSongs);

// GET /api/songs/popular - Get popular songs
router.get('/popular', songController.getPopularSongs);

// GET /api/songs/:songId - Get single song
router.get('/:songId', songController.getSongById);

// POST /api/songs/:songId/play - Increment play count
router.post('/:songId/play', rateLimiters.play, songController.playSong);

// POST /api/songs/:songId/like - Like a song
router.post('/:songId/like', rateLimiters.like, songController.likeSong);

// DELETE /api/songs/:songId/like - Unlike a song
router.delete('/:songId/like', rateLimiters.like, songController.unlikeSong);

// GET /api/songs/:songId/comments - Get song comments
router.get('/:songId/comments', songController.getSongComments);

// POST /api/songs/:songId/comments - Add comment to song
router.post('/:songId/comments', rateLimiters.comment, songController.addSongComment);

module.exports = router;