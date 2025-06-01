const sql = require('mssql');
const { connectToDatabase, db3 } = require('../../../db');

const getAllOrderAllocations = async (date, res) => {
    try {
        console.log(`Received date in controller: ${date}`);

        const pool = await connectToDatabase(db3);
        const query = `
            SELECT
                invoice_number,
                customer_name,
                pickslip_number,
                count (DISTINCT pickslip_line_id) AS pickslip_line_id,
                COUNT(DISTINCT item_code) AS num_of_items,
                SUM(issued_quantity) AS issued_quantity,
                MAX(issued_at) AS issued_date
            FROM issued_stock_table ist
            WHERE (@date IS NULL OR @date = '' OR CAST(ist.issued_at AS DATE) = @date)
            GROUP BY 
                invoice_number,
                customer_name,
                pickslip_number,
                pickslip_line_id;
        `;

        console.log(`Executing query with date: ${date || null}`); 

        const result = await pool.request()
            .input('date', sql.VarChar, date || null)
            .query(query);

        console.log(`Query executed successfully. Rows returned: ${result.recordset.length}`);
        console.log("Query result:", result.recordset); 

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching order allocations:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllOrderAllocations
};
