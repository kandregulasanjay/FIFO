const sql = require('mssql');
const jwt = require('jsonwebtoken');
const { db3, connectToDatabase } = require('../db');

const actionCache = new Map();
const CACHE_EXPIRY = 5000;

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' }); // Ensure consistent message
        }
        return res.status(403).json({ message: 'Invalid or Expired Token' });
    }
};

const logUserAction = async (req, res, next) => {
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next();
    
    const { user, method, originalUrl, body } = req;
    const action = `${method} ${originalUrl}`;
    const details = JSON.stringify(body);
    const cacheKey = `${user.id}-${action}-${details}`;

    if (actionCache.has(cacheKey)) {
        return next(); 
    }

    actionCache.set(cacheKey, Date.now());
    setTimeout(() => actionCache.delete(cacheKey), CACHE_EXPIRY);

    console.log(`User ${user.id} performed action: ${action}`);

    try {
        const pool = await connectToDatabase(db3);
        await pool.request()
            .input('userId', sql.Int, user.id)
            .input('action', sql.NVarChar, action)
            .input('details', sql.NVarChar, details)
            .input('timestamp', sql.DateTime, new Date())
            .query('INSERT INTO UserActions (userId, action, details, timestamp) VALUES (@userId, @action, @details, @timestamp)');
    } catch (err) {
        console.error('Error logging user action:', err.message);
    }

    next();
};


module.exports = { authenticateToken, logUserAction };
