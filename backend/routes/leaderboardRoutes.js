const express = require('express');
const {getLeaderboard, getUserStats} = require('../controllers/leaderboardController');
const {authenticateToken} = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard - Get top users (public)
router.get('/', getLeaderboard);

// GET /api/leaderboard/me - Get logged-in user's stats and rank
router.get('/me', authenticateToken, getUserStats);

module.exports = router;