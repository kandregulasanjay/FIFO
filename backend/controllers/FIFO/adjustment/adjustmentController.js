const sql = require('mssql');
const {  db3, connectToDatabase } = require('../../../db');

const saveAdjustment = async (req, res) => {
    const { store,type, line_id, make, item_code, batch_number, bin_location, quantity, status } = req.body;

    let transaction;

    try {
        const pool = await connectToDatabase(db3);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = transaction.request();
        request.input("store", sql.Int, store);
        request.input("type", sql.VarChar, type);
        request.input("line_id", sql.Int, line_id);
        request.input("make", sql.VarChar, make);
        request.input("item_code", sql.VarChar, item_code);
        request.input("batch_number", sql.VarChar, batch_number);
        request.input("bin_location", sql.VarChar, bin_location);
        request.input("quantity", sql.Int, quantity);
        request.input("status", sql.VarChar, status);
        await request.query(`
            INSERT INTO adjustment_table (store,type, line_id, make, item_code, batch_number, bin_location, quantity, status, created_at) 
            VALUES (@store,@type, @line_id, @make, @item_code, @batch_number, @bin_location, @quantity, @status, GetDate())
        `);

        await transaction.commit();
        res.status(201).json({ message: "Adjustment saved successfully" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error saving adjustment data:", error);
        res.status(500).json({ error: "Error saving adjustment data" });
    }
};

const getItemMasterData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query('SELECT * FROM item_master'); 
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching item master data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getBinMasterData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query('SELECT * FROM bin_master'); 
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching bin master data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    saveAdjustment,
    getItemMasterData,
    getBinMasterData
};