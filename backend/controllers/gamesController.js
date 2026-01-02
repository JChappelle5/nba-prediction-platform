const pool = require('../config/db');

// Get all upcoming games (scheduled status)
const getUpcomingGames = async (req, res) =>
{
    try
    {
        const result = await pool.query(
            `SELECT
            g.id,
            g.status,
            ht.id as home_team_id,
            ht.name as home_team_name,
            ht.abbreviation as home_team_abbreviation,
            vt.id as away_team_id,
            vt.name as away_team_name,
            vt.abbreviation as away_team_abbreviation
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams vt ON g.away_team_id = vt.id
            WHERE g.status = 'scheduled' AND g.game_date >= CURRENT_DATE
            ORDER BY g.game_date ASC`
        );

        res.json(
            {
                success: true,
                count: result.rows.length,
                games: result.rows
            }
        );
    }
    catch (error)
    {
        console.error('Error fetching upcoming games:', error);
        res.status(500).json({ error: 'Server error fetching games'});
    }
};


// Get a specific game by ID
const getGameById = async (req, res) =>
{
    try
    {
        const {id} = req.params;

        const result = await pool.query(
            `SELECT
            g.id,
            g.game_date,
            g.home_score,
            g.away_store,
            g.status,
            ht.id as home_team_id,
            ht.name as home_team_name,
            ht.abbreviation as home_team_abbreviation,
            vt.id as away_team_id,
            vt.name as away_team_name,
            vt.abbreviation as away_team_abbreviation,
            wt.id as winner_team_id,
            wt.name as winner_team_name,
            wt.abbreviation as winner_team_abbreviation
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams vt ON g.away_team_id = vt.id
            LEFT JOIN teams wt ON g.actual_winner_team_id = wt.id
            WHERE g.id = $1`,
            [id]
        );

        if (result.rows.length === 0)
        {
            return res.status(404).json({error: 'Game not found'});
        }

        res.json(
            {
                success: true,
                game: result.rows[0]
            });
    }
    catch (error)
    {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Server error fetching game'});
    }
};


// Get all games
const getAllGames = async (req, res) =>
{
    try
    {
        const { status, date } = req.query;

        let query = `
        SELECT 
        g.id,
        g.game_date,
        g.home_score,
        g.away_score,
        g.status,
        ht.id as home_team_id,
        ht.name as home_team_name,
        ht.abbreviation as home_team_abbreviation,
        vt.id as away_team_id,
        vt.name as away_team_name,
        vt.abbreviation as away_team_abbreviation
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams vt ON g.away_team_id = vt.id
        WHERE 1=1`;

        const params = [];
        let paramCount = 1;

        if (status) 
        {
            query += ` AND g.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (date)
        {
            query += ` AND DATE(g.game_date) = $${paramCount}`;
            params.push(date);
            paramCount++;
        }

        query += ` ORDER BY g.game_date DESC`;

        const result = await pool.query(query, params);

        res.json(
            {
                success: true,
                count: result.rows.length,
                games: result.rows
            });
    }
    catch (error)
    {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Server error fetching games'});
    }
};


// get today's games
const getTodaysGames = async (req, res) =>
{
    try
    {
        const result = await pool.query(
        `SELECT 
        g.id,
        g.game_date,
        g.home_score,
        g.away_score,
        g.status,
        ht.id as home_team_id,
        ht.name as home_team_name,
        ht.abbreviation as home_team_abbreviation,
        vt.id as away_team_id,
        vt.name as away_team_name,
        vt.abbreviation as away_team_abbreviation
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams vt ON g.away_team_id = vt.id
        WHERE DATE(g.game_date) = CURRENT_DATE
        ORDER BY g.game_date ASC`
        );

        res.json(
        {
            success: true,
            count: result.rows.length,
            games: result.rows
        });
    }
    catch (error)
    {
        console.error('Error fetching today\'s games:', error);
        res.status(500).json({ error: 'Server error fetching games'});
    }
};


module.exports = {
  getUpcomingGames,
  getGameById,
  getAllGames,
  getTodaysGames
};