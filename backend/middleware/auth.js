const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) =>
{
    // Get token from authorization header
    const authHeader = req.headers['authorization'];

    // Format: "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
    {
        return res.status(401).json({ error: 'Access token required'});
    }

    try
    {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request object
        req.user = decoded;

        // Continue to next middleware/controller
        next();
    }
    catch (error)
    {
        return res.status(403).json({ error: 'Invalid or expired token'});
    }
};

module.exports = {authenticateToken};