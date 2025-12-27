const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => 
{
	try
	{
		const { username, email, password } = req.body;
		
		// Validate input
		if (!username || !email || !password)
		{
			return res.status(400).json({error: 'All fields are required' });
		}
		
		// Check if user already exists
		const userExists = await pool.query( 'SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
		
		if (userExists.rows.length > 0)
		{
			return res.status(400).json({ error: 'User already exists' });
		}
		
		// Hash password
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		
		// Insert new user
		const newUser = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, total_points, created_at', [username, email, hashedPassword]);
		
		const token = jwt.sign({ userId: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
		res.status(201).json({ message: 'User registered successfully', token, user: newUser.rows[0]});
	}
	catch (error)
	{
		console.error('Register error:', error);
		res.status(500).json({ error: 'Server error during regestration' });
	}
};



// Login user
const login = async (req, res) => 
{
	try
	{
		const { email, password } = req.body;
		
		// Validate input
		if (!email || !password)
		{
			return res.status(400).json({ error: 'Email and password are required' });
		}
		
		// Find user
		const user = await pool.query( 'SELECT * FROM users WHERE email = $1', [email]);
		
		if (user.rows.length === 0)
		{
			return res.status(401).json({ error: 'Invalid credentials' });
		}
		
		// Chack password
		const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
		
		if (!validPassword)
		{
			return res.status(401).json({ error: 'Invalid credentials' });
		}
		
		// Update last_login
		await pool.query( 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.rows[0].id]);
		
		// Generate JWT token
		const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
		
		// Don't send password_hash to client
		const { password_hash, ...userWithoutPassword } = user.rows[0];
		
		res.json({ message: 'Login successful', token, user: userWithoutPassword});
	}
	catch (error)
	{
		console.error('Login error:', error);
		res.status(500).json({ error: 'Server error during login' });
	}
};

module.exports = { register, login };