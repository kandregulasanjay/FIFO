const { db3, connectToDatabase } = require('../../../db');

const getViewData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query('SELECT * FROM vw_availability'); 
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching view data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getViewData
};

