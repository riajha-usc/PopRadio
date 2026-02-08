const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const rateLimiters = require('../middleware/rateLimiter');

// GET /api/playlists - Get all playlists
router.get('/', playlistController.getPlaylists);

// GET /api/playlists/featured - Get featured playlists
router.get('/featured', playlistController.getFeaturedPlaylists);

// GET /api/playlists/:playlistId - Get single playlist
router.get('/:playlistId', playlistController.getPlaylistById);

// POST /api/playlists/:playlistId/like - Like a playlist
router.post('/:playlistId/like', rateLimiters.like, playlistController.likePlaylist);

// DELETE /api/playlists/:playlistId/like - Unlike a playlist
router.delete('/:playlistId/like', rateLimiters.like, playlistController.unlikePlaylist);

// GET /api/playlists/:playlistId/comments - Get playlist comments
router.get('/:playlistId/comments', playlistController.getPlaylistComments);

// POST /api/playlists/:playlistId/comments - Add comment to playlist
router.post('/:playlistId/comments', rateLimiters.comment, playlistController.addPlaylistComment);

module.exports = router;