const sql = require('mssql');
require('dotenv').config();

const sourcedb = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB1_NAME,
    options: { encrypt: process.env.DB_OPTIONS_ENCRYPT === 'true' }
};

const targetdb = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB2_NAME,
    options: { encrypt: process.env.DB_OPTIONS_ENCRYPT === 'true' }
};

const db3 = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB3_NAME,
    options: { encrypt: process.env.DB_OPTIONS_ENCRYPT === 'true' }
};

const connectToDatabase = async (config) => {
    try {
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        return pool;
    } catch (err) {
        console.error(`❌ Database Connection Failed (${config.database}):`, err.message);
        return null;
    }
};

module.exports = { sourcedb, targetdb, db3, connectToDatabase };
