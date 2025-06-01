const sql = require('mssql');
const { db3, connectToDatabase } = require('../../../db');

const getReceiptAllocations = async (date, res) => {
    try {
        console.log("Received date parameter:", date); 
        const pool = await connectToDatabase(db3);
        const query = `
            SELECT
                supplier_name,
                receipt_number,
                COUNT(DISTINCT item_code) AS num_of_items,
                SUM(allocated_quantity) AS allocated_quantity,
                MAX(created_at) AS allocation_date
            FROM allocation_table
            WHERE (@date IS NULL OR @date = '' OR CAST(created_at AS DATE) = @date) -- Match exact date
            GROUP BY supplier_name, receipt_number
        `;
        const result = await pool.request()
            .input('date', sql.VarChar, date || null)
            .query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching receipt allocations:", error.message);
        res.status(500).send("Error fetching receipt allocations");
    }
};

module.exports = { getReceiptAllocations };

