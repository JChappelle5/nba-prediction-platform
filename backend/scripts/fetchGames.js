const axios = require('axios');
const pool = require('../config/db');

// BallDontLie API
const API_BASE_URL = 'https://api.balldontlie.io';
const API_KEY = process.env.BALLDONTLIE_API_KEY;

// Helper function to map team abbreviation to database team ID
async function getTeamIdByAbbreviation(abbreviation) {
    const result = await pool.query('SELECT id FROM teams WHERE abbreviation = $1', [abbreviation]);
    return result.rows[0]?.id;
}

// Fetch games from BallDontLie API
async function fetchGames() {
    try {
        console.log('Fetching NBA games...');

        // Fetch from 2 days ago to 7 days ahead
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 2);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        const startDateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        console.log(`Fetching games from ${startDateString} to ${endDateString}`);

        const response = await axios.get(`${API_BASE_URL}/v1/games`, {
            params: {
                start_date: startDateString,  // Changed from startDate
                end_date: endDateString,      // Changed from endDate
                per_page: 100
            },
            headers: {
                'Authorization': `${API_KEY}`
            }
        });

        const games = response.data.data;
        console.log(`Found ${games.length} games`);

        let insertedCount = 0;
        let skippedCount = 0;

        for (const game of games) {
            // Skip games with no datetime (historical/invalid games)
            if (!game.datetime) {
                console.log(`Skipping game: No datetime provided`);
                skippedCount++;
                continue;
            }

            // Map team abbreviations to database IDs
            const homeTeamId = await getTeamIdByAbbreviation(game.home_team.abbreviation);
            const awayTeamId = await getTeamIdByAbbreviation(game.visitor_team.abbreviation);

            if (!homeTeamId || !awayTeamId) {
                console.log(`Skipping game: Team not found (${game.home_team.abbreviation} vs ${game.visitor_team.abbreviation})`);
                skippedCount++;
                continue;
            }

            // Determine status
            let status = 'scheduled';
            if (game.period === 0) {
                status = 'scheduled';
            } else if (game.period > 0 && game.period <= 4) {
                if (game.time === '' || game.time === 'Final' || game.status === 'Final') {
                    status = 'finished';
                } else {
                    status = 'in progress';
                }
            } else if (game.period >= 5) {
                if (game.time === '' || game.time === 'Final' || game.status === 'Final') {
                    status = 'finished';
                } else {
                    status = 'in progress';
                }
            }
            if (game.period === 4 && game.home_team_score > 0 && game.visitor_team_score > 0 && !game.time) {
                status = 'finished';
            }

            // Check if game already exists
            const existingGame = await pool.query(
                'SELECT id FROM games WHERE home_team_id = $1 AND away_team_id = $2 AND DATE(game_date) = DATE($3)',
                [homeTeamId, awayTeamId, game.datetime]
            );

            if (existingGame.rows.length > 0) {
                // If game exists, update it
                await pool.query(
                    `UPDATE games SET home_score = $1, away_score = $2, status = $3 WHERE id = $4`,
                    [
                        game.home_team_score || null,
                        game.visitor_team_score || null,
                        status,
                        existingGame.rows[0].id
                    ]
                );

                console.log(`Updated: ${game.home_team.abbreviation} vs ${game.visitor_team.abbreviation} (${status})`);
                skippedCount++;
                continue;
            }

            // Insert game into database
            const gameDate = game.date;

            await pool.query(
                `INSERT INTO games (home_team_id, away_team_id, game_date, home_score, away_score, status) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    homeTeamId,
                    awayTeamId,
                    gameDate,  
                    game.home_team_score || null,
                    game.visitor_team_score || null,
                    status
                ]
            );

            console.log(`Inserted: ${game.home_team.abbreviation} vs ${game.visitor_team.abbreviation} on ${game.date}`);
            insertedCount++;
        }

        console.log(`\nFetch complete!`);
        console.log(`   Inserted: ${insertedCount} games`);
        console.log(`   Skipped: ${skippedCount} games`);

        process.exit(0);
    } catch (error) {
        console.error('Error fetching games:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        process.exit(1);
    }
}

// Run script
fetchGames();