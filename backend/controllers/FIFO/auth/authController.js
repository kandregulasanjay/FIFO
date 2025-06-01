const jwt = require('jsonwebtoken');
const sql = require('mssql');
const rateLimit = require('express-rate-limit');
const { db3, connectToDatabase } = require('../../../db');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, 
    message: 'Too many login attempts. Try again later.',
});

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const pool = await connectToDatabase(db3);
        if (!pool) return res.status(500).json({ message: 'Database connection failed' });

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id, username, password FROM Users WHERE username = @username');

        const user = result.recordset[0];
        // console.log('User fetched from database:', user); // Debug log

        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({ message: 'Internal server error' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // console.log('Generated JWT token:', token); // Debug log

        // Log login action
        await pool.request()
            .input('userId', sql.Int, user.id)
            .input('action', sql.NVarChar, 'User logged in')
            .input('details', sql.NVarChar, JSON.stringify({ ip: req.ip, userAgent: req.headers['user-agent'] }))
            .input('timestamp', sql.DateTime, new Date())
            .query('INSERT INTO UserActions (userId, action, details, timestamp) VALUES (@userId, @action, @details, @timestamp)');

        res.json({ token, userId: user.id });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const pool = await connectToDatabase(db3);
        if (!pool) return res.status(500).json({ message: 'Database connection failed' });

        await pool.request()
            .input('userId', sql.Int, userId)
            .input('action', sql.NVarChar, 'User logged out')
            .input('details', sql.NVarChar, null)
            .input('timestamp', sql.DateTime, new Date())
            .query('INSERT INTO UserActions (userId, action, details, timestamp) VALUES (@userId, @action, @details, @timestamp)');

        res.status(200).json({ message: 'User logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { login, logout, loginLimiter };
