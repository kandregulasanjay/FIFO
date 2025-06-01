const { db3, connectToDatabase } = require('../../db');

const getManualReports = async (req, res) => {
    try {
        const { receiptNumber, itemCode, supplierName, receiptDate } = req.query; // Get query parameters
        const pool = await connectToDatabase(db3);
        if (!pool) return res.status(500).send('Database connection failed.');

        let query = 'SELECT * FROM receipt_master WHERE 1=1';

        // Add filters dynamically
        if (receiptNumber) {
            query += ` AND receipt_number = '${receiptNumber}'`;
        }
        if (itemCode) {
            query += ` AND item_code = '${itemCode}'`;
        }
        if (supplierName) {
            query += ` AND supplier_name LIKE '%${supplierName}%'`;
        }
        if (receiptDate) {
            query += ` AND receipt_date = '${receiptDate}'`;
        }

        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching manual reports:', err.message);
        res.status(500).send('Error fetching manual reports.');
    }
};


const getItemCodes = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        if (!pool) return res.status(500).send('Database connection failed.');

        const result = await pool.request().query('SELECT DISTINCT item_code FROM item_master');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching item codes:', err.message);
        res.status(500).send('Error fetching item codes.');
    }
};

module.exports = { getManualReports, getItemCodes };