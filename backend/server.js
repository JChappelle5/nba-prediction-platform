const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());


// Import database connection to test it
require('./config/db');


// Import routes
const authRoutes = require('./routes/authRoutes');
const gamesRoutes = require('./routes/gamesRoutes');
const predictionsRoutes = require('./routes/predictionsRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');


// Basic test route
app.get('/', (req, res) => 
{
  res.json({ message: 'NBA Prediction Platform API is running' });
});


// Health check route
app.get('/health', (req, res) => 
{
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);


// Start server
app.listen(PORT, () => 
{
  console.log(`Server running on http://localhost:${PORT}`);
});