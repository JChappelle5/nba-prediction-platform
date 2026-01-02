const express = require('express');
const
{
    getUpcomingGames,
    getGameById,
    getAllGames,
    getTodaysGames
} = require('../controllers/gamesController');

const router = express.Router();

// GET /api/games
router.get('/', getAllGames);

// GET /api/games/upcoming
router.get('/upcoming', getUpcomingGames);

// GET /api/games/today
router.get('/today', getTodaysGames);

// GET /api/games/:id
router.get('/:id', getGameById);

module.exports= router;