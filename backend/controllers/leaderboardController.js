const pool = require('../config/db');

// Get leaderboard
const getLeaderboard = async (req, res) =>
{
    try
    {
        const {limit = 10} = req.query; // Default to top 10

        const result = await pool.query(
            `SELECT 
            u.id,
            u.username,
            u.total_points,
            COUNT(up.id) as total_predictions,
            COUNT(CASE WHEN up.points_awarded > 0 THEN 1 END) as correct_predictions,
            COUNT(CASE WHEN up.points_awarded = 0 THEN 1 END) as incorrect_predictions
            FROM users u
            LEFT JOIN user_predictions up ON u.id = up.user_id
            WHERE up.points_awarded IS NOT NULL
            GROUP BY u.id, u.username, u.total_points
            ORDER BY u.total_points DESC, u.username ASC
            LIMIT $1`,
            [limit]
        );

        // Calculate win percentage for each user
        const leaderboard = result.rows.map((user, index) =>
        ({
            rank: index + 1,
            username: user.username,
            total_points: user.total_points,
            total_predictions: parseInt(user.total_predictions),
            correct_predictions: parseInt(user.correct_predictions),
            incorrect_predictions: parseInt(user.incorrect_predictions),
            win_percentage: user.total_predictions > 0 
                ? ((user.correct_predictions / user.total_predictions) * 100).toFixed(1)
                : '0.0'
        }));

        res.json({
            success: true,
            count: leaderboard.length,
            leaderboard
        });
    }
    catch (error)
    {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({error: 'Server error fetching leaderboard'});
    }
};


// Get user stats (their rank and stats)
const getUserStats = async (req, res) => 
{
    try
    {
        const user_id = req.user.userId;

        // Get user's stats
        const userStats = await pool.query(
            `SELECT 
            u.id,
            u.username,
            u.total_points,
            COUNT(up.id) as total_predictions,
            COUNT(CASE WHEN up.points_awarded > 0 THEN 1 END) as correct_predictions,
            COUNT(CASE WHEN up.points_awarded = 0 THEN 1 END) as incorrect_predictions,
            COUNT(CASE WHEN up.points_awarded IS NULL THEN 1 END) as pending_predictions
            FROM users u
            LEFT JOIN user_predictions up ON u.id = up.user_id
            WHERE u.id = $1
            GROUP BY u.id, u.username, u.total_points`,
            [user_id]
        );

        if (userStats.rows.length === 0) 
        {
            return res.status(404).json({error: 'User not found'});
        }

        const stats = userStats.rows[0];

        // Get user's rank
        const rankResult = await pool.query(
            `SELECT COUNT(*) + 1 as rank
            FROM users
            WHERE total_points > (SELECT total_points FROM users WHERE id = $1)`,
            [user_id]
        );

        const rank = parseInt(rankResult.rows[0].rank);
        const total_predictions = parseInt(stats.total_predictions);
        const correct_predictions = parseInt(stats.correct_predictions);
        const incorrect_predictions = parseInt(stats.incorrect_predictions);
        const pending_predictions = parseInt(stats.pending_predictions);

        const win_percentage = total_predictions > 0 ? ((correct_predictions / total_predictions) * 100).toFixed(1) : '0.0';

        res.json(
            {
                success: true,
                stats: 
                {
                    rank,
                    username: stats.username,
                    total_points: stats.total_points,
                    total_predictions,
                    correct_predictions,
                    incorrect_predictions,
                    pending_predictions,
                    win_percentage
                }
            });
    }
    catch (error)
    {
        console.error('Error fetching user stats:', error);
        res.status(500).json({error:'Server error fetching stats'});
    }
};


module.exports = 
{
    getLeaderboard,
    getUserStats
};