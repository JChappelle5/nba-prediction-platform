const pool = require('../config/db');

// Create new prediction
const createPrediction = async (req, res) => 
{
    try
    {
        const { game_id, predicted_winner_team_id } = req.body;
        const user_id = req.user.userId; 

        if (!game_id || !predicted_winner_team_id)
        {
            return res.status(400).json({ error: 'game_id and predicted_winner_team_id are required'});
        }

        // Check if game exists and is 'scheduled'
        const game = await pool.query( 'SELECT * FROM games WHERE id = $1', [game_id]);

        if (game.rows.length === 0)
        {
            return res.status(404).json({ error: 'Game not found'});
        }

        if (game.rows[0].status.trim() !== 'scheduled')
        {
            return res.status(400).json({ error: 'Cannot predict on a game that has already started or finished'});
        }

        // Verify the predicted winning team is in this game
        const gameData = game.rows[0];
        if (predicted_winner_team_id !== gameData.home_team_id && predicted_winner_team_id !== gameData.away_team_id)
        {
            return res.status(400).json({ error: 'Predicted team is not playing in this game'});
        }

        // Check if user already made a prediction for this game
        const existingPrediction = await pool.query( 'SELECT * FROM user_predictions WHERE user_id = $1 AND game_id = $2', [user_id, game_id]);

        if (existingPrediction.rows.length > 0)
        {
            return res.status(400).json({ error: 'You have already made a prediction for this game'});
        }

        // Create the prediction
        const result = await pool.query(
            `INSERT INTO user_predictions (user_id, game_id, predicted_winner_team_id)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, game_id, predicted_winner_team_id, created_at`,
            [user_id, game_id, predicted_winner_team_id]
        );

        res.status(201).json(
            {
                success: true,
                message: 'Prediction created successfully',
                prediction: result.rows[0]
            }
        );
    }
    catch (error)
    {
        console.error('Error creating prediction:', error);
        res.status(500).json({ error: 'Server error creating prediction'});
    }
};


// Get all predictions for the logged-in user
const getUserPredictions = async (req, res) =>
{
    try
    {
        const user_id = req.user.userId;

        const result = await pool.query(
            `SELECT 
            up.id,
            up.game_id,
            up.predicted_winner_team_id,
            up.points_awarded,
            up.created_at,
            g.game_date,
            g.status as game_status,
            g.home_score,
            g.away_score,
            ht.name as home_team_name,
            ht.abbreviation as home_team_abbreviation,
            vt.name as away_team_name,
            vt.abbreviation as away_team_abbreviation,
            pt.name as predicted_team_name,
            pt.abbreviation as predicted_team_abbreviation,
            wt.name as actual_winner_name,
            wt.abbreviation as actual_winner_abbreviation
            FROM user_predictions up
            JOIN games g ON up.game_id = g.id
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams vt ON g.away_team_id = vt.id
            JOIN teams pt ON up.predicted_winner_team_id = pt.id
            LEFT JOIN teams wt ON g.actual_winner_team_id = wt.id
            WHERE up.user_id = $1
            ORDER BY g.game_date DESC`,
            [user_id]
        );

        res.json(
            {
                success: true,
                count: result.rows.length,
                predictions: result.rows
            }
        );
    }
    catch (error)
    {
        console.error('Error fetching user predictions:', error);
        res.status(500).json({ error: 'Server error fetching predictions'});
    }
};


// Get a specific prediction by ID
const getPredictionById = async (req, res) =>
{
    try
    {
        const{id} = req.params;
        const user_id = req.user.userId;

        const result = await pool.query(
            `SELECT 
            up.id,
            up.game_id,
            up.predicted_winner_team_id,
            up.points_awarded,
            up.created_at,
            g.game_date,
            g.status as game_status,
            g.home_score,
            g.away_score,
            ht.name as home_team_name,
            ht.abbreviation as home_team_abbreviation,
            vt.name as away_team_name,
            vt.abbreviation as away_team_abbreviation,
            pt.name as predicted_team_name,
            pt.abbreviation as predicted_team_abbreviation
            FROM user_predictions up
            JOIN games g ON up.game_id = g.id
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams vt ON g.away_team_id = vt.id
            JOIN teams pt ON up.predicted_winner_team_id = pt.id
            WHERE up.id = $1 AND up.user_id = $2`,
            [id, user_id]
        );

        if (result.rows.length === 0)
        {
            return res.status(404).json({ error: 'Prediction not found'});
        }

        res.json(
            {
                success: true,
                prediction: result.rows[0]
            }
        );
    }
    catch (error)
    {
        console.error('Error fetching prediction:', error);
        res.status(500).json({ error: 'Server error fetching prediction'});
    }
};


// Get predictions for a specific game for all users (for leaderboards/comparison)
const getPredictionsForGame = async (req, res) =>
{
    try
    {
        const{game_id} = req.params;

        // Only show predictions after the game has started 
        const game = await pool.query( 'SELECT status FROM games WHERE id = $1', [game_id]);

        if (game.rows.length === 0)
        {
            return res.status(404).json({ error: 'Game not found'});
        }

        if (game.rows.status == 'scheduled')
        {
            return res.status(400).json({ error: 'Predictions aree hidden until game starts'});
        }

        const result = await pool.query(
            `SELECT 
            up.id,
            up.points_awarded,
            u.username,
            pt.name as predicted_team_name,
            pt.abbreviation as predicted_team_abbreviation
            FROM user_predictions up
            JOIN users u ON up.user_id = u.id
            JOIN teams pt ON up.predicted_winner_team_id = pt.id
            WHERE up.game_id = $1
            ORDER BY up.created_at ASC`,
            [game_id]
        );

        res.json(
            {
                success: true,
                count: result.rows.length,
                predictions: result.rows
            }
        );
    }
    catch (error)
    {
        console.error('Error fetching game predictions:', error);
        res.status(500).json({ error: 'Server error fetching predictions'});
    }
};

module.exports =
{
    createPrediction,
    getUserPredictions,
    getPredictionById,
    getPredictionsForGame
};