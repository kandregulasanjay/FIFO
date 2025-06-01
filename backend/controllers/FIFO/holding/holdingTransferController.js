const sql = require('mssql');
const {  db3, connectToDatabase } = require('../../../db');

exports.getAvailability = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query('SELECT * FROM order_master'); 

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching availability data:', error);
        res.status(500).json({ error: 'Error fetching availability data' });
    }
};

exports.saveTransfer = async (req, res) => {
    const transfers = req.body;

    if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
        return res.status(400).json({ error: "Invalid transfer data" });
    }

    let transaction;

    try {
        const pool = await connectToDatabase(db3);
        transaction = new sql.Transaction(pool);
        await transaction.begin(); 

        for (const transfer of transfers) {
            const { bin_location, batch_number, make, item_code, available_quantity, new_bin_location, new_allocated_qty } = transfer;

            if (!bin_location || !batch_number || !make || !item_code || available_quantity === undefined || !new_bin_location || new_allocated_qty === undefined) {
                console.error("Validation error:", transfer);
                await transaction.rollback();
                return res.status(400).json({ error: "Missing required fields" });
            }

            const request = transaction.request(transaction);
            request.input("bin_location", sql.VarChar, bin_location);
            request.input("batch_number", sql.VarChar, batch_number);
            request.input("make", sql.VarChar, make);
            request.input("item_code", sql.VarChar, item_code);
            request.input("available_quantity", sql.Int, available_quantity);
            request.input("new_bin_location", sql.VarChar, new_bin_location);
            request.input("new_allocated_qty", sql.Int, new_allocated_qty);

            await request.query(`
                INSERT INTO transfer_table (bin_location, batch_number, make, item_code, available_quantity, new_bin_location, new_allocated_qty) 
                VALUES (@bin_location, @batch_number, @make, @item_code, @available_quantity, @new_bin_location, @new_allocated_qty)
            `);
        }

        await transaction.commit();
        res.status(201).json({ message: "Transfer saved successfully" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error saving transfer data:", error);
        res.status(500).json({ error: "Error saving transfer data" });
    }
};

exports.getBinMasterData = async (req, res) => {
    let pool;
    try {
         pool = await connectToDatabase(db3);

        const sections = await pool.request().query('SELECT DISTINCT section FROM bin_master WHERE bin_status = \'Active\'');
        const sub_sections = await  pool.request().query('SELECT DISTINCT section, sub_section FROM bin_master WHERE bin_status = \'Active\'');
        const bins = await  pool.request().query('SELECT section, sub_section, bins FROM bin_master WHERE bin_status = \'Active\'');

        res.json({
            sections: sections.recordset,
            sub_sections: sub_sections.recordset,
            bins: bins.recordset
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching bin master data' });
    }finally {
        if (pool) {
            await pool.close();
        }
    }
};

exports.getCompletedTransfer = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query('SELECT * FROM transfer_table'); 

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching Transfer table data:', error);
        res.status(500).json({ error: 'Error fetching Transfer table data' });
    }
};