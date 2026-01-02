const express = require('express');
const
{
    createPrediction,
    getUserPredictions,
    getPredictionById,
    getPredictionsForGame
} = require('../controllers/predictionsController');

const {authenticateToken} = require('../middleware/auth');

const router = express.Router();

// All prediction routes require authentication
router.use(authenticateToken);

// POST /api/predictions (create new prediction)
router.post('/', createPrediction);

// GET /api/predictions (get all predictions for logged-in user)
router.get('/', getUserPredictions);

// GET /api/predictions/:id (get specific prediction)
router.get('/:id', getPredictionById);

// GET /api/predictions/game/:game_id (get all predictions for a game)
router.get('/game/:game_id', getPredictionsForGame);

module.exports = router;