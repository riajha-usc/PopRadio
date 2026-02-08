const express = require('express');
const router = express.Router();
const radioController = require('../controllers/radioController');

// GET /api/radio/stream - Get current radio stream
router.get('/stream', radioController.getRadioStream);

// POST /api/radio/next - Skip to next song (optional)
router.post('/next', radioController.skipToNext);

module.exports = router;