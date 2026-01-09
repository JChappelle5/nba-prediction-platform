const pool = require('../config/db');

// 10 points awarded for correct predictions
const POINTS_FOR_CORRECT_PREDICTION = 10;

async function scoreGames()
{
    try
    {
        console.log('Starting game scoring progress...\n');

        // Get all finished games that haven't been scored yet
        const finishedGames = await pool.query(`SELECT id, home_team_id, away_team_id, home_score, away_score, actual_winner_team_id 
            FROM games 
            WHERE status = 'finished' AND actual_winner_team_id IS NULL`
        );

        if (finishedGames.rows.length === 0)
        {
            console.log('No games to score.');
            process.exit(0);
        }

        console.log(`Found ${finishedGames.rows.length} finished games to score.\n`);

        let gamesScored = 0;
        let predictionsScored = 0;

        // Score each finished game
        for (const game of finishedGames.rows)
        {
            console.log(`\nScoring Game ID: ${game.id}`);
            console.log(`Home score: ${game.home_score}, Away score: ${game.away_score}`);

            // Determine the winner
            let winner_team_id;
            if (game.home_score > game.away_score)
            {
                winner_team_id = game.home_team_id;
                console.log(`Winner: Home team (ID: ${winner_team_id})`);
            }
            else if (game.home_score < game.away_score)
            {
                winner_team_id = game.away_team_id;
                console.log(`Winner: Away team (ID: ${winner_team_id})`);
            }
            else
            {
                console.log('Game ended in a tie - skipping');
                continue;
            }

            // Update game with actual winner
            await pool.query('UPDATE games SET actual_winner_team_id = $1 WHERE id = $2', [winner_team_id, game.id]);

            // Get all predictions for this game
            const predictions = await pool.query(`SELECT up.id, up.user_id, up.predicted_winner_team_id, u.username
                FROM user_predictions up
                JOIN users u ON up.user_id = u.id
                WHERE up.game_id = $1 AND up.points_awarded IS NULL`,
                [game.id]
            );

            console.log(`Found ${predictions.rows.length} predictions to score`);

            // Score each prediction
            for (const prediction of predictions.rows)
            {
                const isCorrect = prediction.predicted_winner_team_id === winner_team_id;
                const points = isCorrect ? POINTS_FOR_CORRECT_PREDICTION : 0;

                // Update prediction with points
                await pool.query('UPDATE user_predictions SET points_awarded = $1 WHERE id = $2', [points, prediction.id]);

                // Update user's total points
                if (isCorrect)
                {
                    await pool.query('UPDATE users SET total_points = total_points + $1 WHERE id = $2', [points, prediction.user_id]);
                    console.log(`${prediction.username}: Correct! +${points} points`);
                }
                else
                {
                    console.log(`${prediction.username}: Incorrect (0 points)`);
                }

                predictionsScored++;
            }

            gamesScored++;
        }

        console.log('\n' + '='.repeat(50));
        console.log('Scoring complete!');
        console.log(`   Games scored: ${gamesScored}`);
        console.log(`   Predictions scored: ${predictionsScored}`);
        console.log('='.repeat(50));

        process. exit(0);
    }
    catch (error)
    {
        console.error('Error scoring games:', error.message);
        console.error(error);
        process.exit(1);
    }
}

scoreGames();