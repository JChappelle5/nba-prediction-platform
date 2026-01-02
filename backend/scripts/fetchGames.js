const axios = require('axios');
const pool = require('../config/db');


// BallDontLie API
const API_BASE_URL = 'https://api.balldontlie.io';
const API_KEY = process.env.BALLDONTLIE_API_KEY;


// Helper function to map team abbreviation to database team ID
async function getTeamIdByAbbreviation(abbreviation)
{
    const result = await pool.query( 'SELECT id FROM teams WHERE abbreviation = $1', [abbreviation]);
    return result.rows[0]?.id;
}


// Fetch games from BallDontLie API
async function fetchGames() 
{
    try
    {
        console.log('Fetching NBA games...');

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        console.log(`Fetching games starting from: ${dateString}`);

            console.log(`Fetching games starting from: ${dateString}`);
        
        // Check if API key is loaded
        if (!API_KEY) {
        console.error('API key not found! Make sure BALLDONTLIE_API_KEY is set in .env');
        process.exit(1);
        }

        // Fetch games for today and next 7 days
        const response = await axios.get(`${API_BASE_URL}/v1/games`, 
            {
                params: 
                {
                    start_date: dateString,
                    per_page: 100
                },
                headers:
                {
                    'Authorization': `${API_KEY}`
                }
            });

            const games = response.data.data;
            console.log(`Found ${games.length} games`);

            let insertedCount = 0;
            let skippedCount = 0;

            for (const game of games)
            {
                // Map team abbreviations to database IDs
                const homeTeamId = await getTeamIdByAbbreviation(game.home_team.abbreviation);
                const awayTeamId = await getTeamIdByAbbreviation(game.visitor_team.abbreviation);

                if (!homeTeamId || !awayTeamId)
                {
                    console.log(`Skipping game: Team not found (${game.home_team.abbreviation} vs ${game.visitor_team.abbreviation})`);
                    skippedCount++;
                    continue;
                }

                // Check if game already exists
                const existingGame = await pool.query( 'SELECT id FROM games WHERE home_team_id = $1 AND away_team_id = $2 AND game_date = $3', [homeTeamId, awayTeamId, game.date]);

                if (existingGame.rows.length > 0)
                {
                    console.log(`Game already exists : ${game.home_team.abbreviation} vs ${game.visitor_team.abbreviation}`);
                    skippedCount++;
                    continue;
                }

                // Determine status
                let status = 'scheduled';
                if (game.status === 'Final')
                {
                    status = 'finished';
                }
                else if (game.status !== 'Final' && game.period > 0 ) 
                {
                    status = 'in_progress';
                }

                // Insert game into database
                await pool.query(`INSERT INTO games (home_team_id, away_team_id, game_date, home_score, away_score, status) VALUES ($1, $2, $3, $4, $5, $6)`, [homeTeamId, awayTeamId, game.date, game.home_team_score || null, game.visitor_team_score || null, status]);

                console.log(`Inserted: ${game.home_team.abbreviation} vs ${game.visitor_team.abbreviation} on ${game.date}`);
                insertedCount++;
            }

            console.log(`\nFetch complete!`);
            console.log(`   Inserted: ${insertedCount} games`);
            console.log(`   Skipped: ${skippedCount} games`);

            process.exit(0);
    }
    catch (error)
    {
        console.error('Error fetching games:', error.message);
        if (error.response)
        {
            console.error('API Response:', error.response.data);
        }

        process.exit(1);
    }    
}

// Run script
fetchGames();