-- NBA Prediction Platform Database Schema

DROP TABLE IF EXISTS user_predictions CASCADE;
DROP TABLE IF EXISTS system_predictions CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;


CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    logo_url VARCHAR(255),
    conference VARCHAR(10),
    division VARCHAR(50)
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);


CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    game_date TIMESTAMP NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    actual_winner_team_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (actual_winner_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'finished'))
);


CREATE TABLE user_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    predicted_winner_team_id INTEGER NOT NULL,
    points_awarded INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (predicted_winner_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_game_prediction UNIQUE (user_id, game_id)
);


CREATE TABLE system_predictions (
    game_id INTEGER PRIMARY KEY,
    predicted_winner_team_id INTEGER NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (predicted_winner_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 100)
);

-- indexes for better query performance
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_user_predictions_user_id ON user_predictions(user_id);
CREATE INDEX idx_user_predictions_game_id ON user_predictions(game_id);
CREATE INDEX idx_users_total_points ON users(total_points DESC);

-- NBA teams 
INSERT INTO teams (name, abbreviation, conference, division) VALUES
-- Eastern Conference - Atlantic
('Boston Celtics', 'BOS', 'East', 'Atlantic'),
('Brooklyn Nets', 'BKN', 'East', 'Atlantic'),
('New York Knicks', 'NYK', 'East', 'Atlantic'),
('Philadelphia 76ers', 'PHI', 'East', 'Atlantic'),
('Toronto Raptors', 'TOR', 'East', 'Atlantic'),

-- Eastern Conference - Central
('Chicago Bulls', 'CHI', 'East', 'Central'),
('Cleveland Cavaliers', 'CLE', 'East', 'Central'),
('Detroit Pistons', 'DET', 'East', 'Central'),
('Indiana Pacers', 'IND', 'East', 'Central'),
('Milwaukee Bucks', 'MIL', 'East', 'Central'),

-- Eastern Conference - Southeast
('Atlanta Hawks', 'ATL', 'East', 'Southeast'),
('Charlotte Hornets', 'CHA', 'East', 'Southeast'),
('Miami Heat', 'MIA', 'East', 'Southeast'),
('Orlando Magic', 'ORL', 'East', 'Southeast'),
('Washington Wizards', 'WAS', 'East', 'Southeast'),

-- Western Conference - Northwest
('Denver Nuggets', 'DEN', 'West', 'Northwest'),
('Minnesota Timberwolves', 'MIN', 'West', 'Northwest'),
('Oklahoma City Thunder', 'OKC', 'West', 'Northwest'),
('Portland Trail Blazers', 'POR', 'West', 'Northwest'),
('Utah Jazz', 'UTA', 'West', 'Northwest'),

-- Western Conference - Pacific
('Golden State Warriors', 'GSW', 'West', 'Pacific'),
('LA Clippers', 'LAC', 'West', 'Pacific'),
('Los Angeles Lakers', 'LAL', 'West', 'Pacific'),
('Phoenix Suns', 'PHX', 'West', 'Pacific'),
('Sacramento Kings', 'SAC', 'West', 'Pacific'),

-- Western Conference - Southwest
('Dallas Mavericks', 'DAL', 'West', 'Southwest'),
('Houston Rockets', 'HOU', 'West', 'Southwest'),
('Memphis Grizzlies', 'MEM', 'West', 'Southwest'),
('New Orleans Pelicans', 'NOP', 'West', 'Southwest'),
('San Antonio Spurs', 'SAS', 'West', 'Southwest');

-- Verify the setup
SELECT 'Teams created: ' || COUNT(*) FROM teams;
SELECT 'Schema setup complete!' AS status;