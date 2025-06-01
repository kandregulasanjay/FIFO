const sql = require('mssql');
const {  db3, connectToDatabase } = require('../../../db');

const getHoldingData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query(`
            select * from vw_holding
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching holding data:", error);
        res.status(500).json({ error: "Error fetching holding data" });
    }
};

const saveHoldingTransfer = async (req, res) => {
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
            const { 
                pickslip_number, pickslip_line_id, make, item_code, issued_qty, remaining_qty, batch_number, 
                bin_location, new_bin_location, new_allocated_qty, issued_at, status, customer_name, ordered_qty , invoice_number
            } = transfer;
            
            if (!pickslip_number || !pickslip_line_id || !make || !item_code || !batch_number || !bin_location || 
                !new_bin_location || new_allocated_qty === undefined || !customer_name || issued_qty === undefined || 
                remaining_qty === undefined || ordered_qty === undefined) {
                console.error("Validation error:", transfer);
                await transaction.rollback();
                return res.status(400).json({ error: "Missing required fields" });
            }

            const request = transaction.request();
            request.input("pickslip_number", sql.VarChar, pickslip_number);
            request.input("pickslip_line_id", sql.Int, pickslip_line_id);
            request.input("make", sql.VarChar, make);
            request.input("item_code", sql.VarChar, item_code);
            request.input("issued_qty", sql.Int, issued_qty);
            request.input("remaining_qty", sql.Int, remaining_qty);
            request.input("batch_number", sql.VarChar, batch_number);
            request.input("bin_location", sql.VarChar, bin_location);
            request.input("new_bin_location", sql.VarChar, new_bin_location);
            request.input("new_allocated_qty", sql.Int, new_allocated_qty);
            request.input("issued_at", sql.DateTime, issued_at);
            request.input("status", sql.VarChar, status || "Pending");
            request.input("customer_name", sql.VarChar, customer_name);
            request.input("ordered_qty", sql.Int, ordered_qty);
            request.input("invoice_number", sql.VarChar, invoice_number);

            await request.query(`
                INSERT INTO holding_table (pickslip_number, pickslip_line_id, make, item_code, issued_qty, remaining_qty, 
                    batch_number, bin_location, new_bin_location, new_allocated_qty, issued_at, status, customer_name, ordered_qty, invoice_number) 
                VALUES (@pickslip_number, @pickslip_line_id, @make, @item_code, @issued_qty, @remaining_qty, @batch_number, 
                    @bin_location, @new_bin_location, @new_allocated_qty, ISNULL(@issued_at, GETDATE()), @status, @customer_name, @ordered_qty, @invoice_number)
            `); 
        }
        await transaction.commit();
        res.status(201).json({ message: 'Transfer saved successfully' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error saving holding transfer data:', error); 
        res.status(500).json({ error: 'Error saving holding transfer data' });
    }
};

const getHoldingForPDF = async (req, res) => {
    const { pickslip_number } = req.params;
    try {
        console.log(`Fetching pickslip data for: ${pickslip_number}`);
        const pool = await connectToDatabase(db3);

        const holdingTableResult = await pool.request().query(`
            SELECT *
            FROM holding_table
            WHERE pickslip_number = '${pickslip_number}'
            ORDER BY created_at DESC
        `);

        console.log("Query result:", holdingTableResult.recordset);

        if (holdingTableResult.recordset.length === 0) {
            return res.status(404).json({ error: "No data found for the given pickslip number" });
        }

        res.json({
            invoice_number: holdingTableResult.recordset[0].invoice_number,
            customer_name: holdingTableResult.recordset[0].customer_name,
            issued_at: holdingTableResult.recordset[0].issued_at,
            items: holdingTableResult.recordset.map(item => ({
                make: item.make,
                item_code: item.item_code,
                ordered_qty: item.ordered_qty,
                issued_qty: item.issued_qty,
                remaining_qty: item.remaining_qty,
                bin_location: item.bin_location,
                new_bin_location: item.new_bin_location,
                new_allocated_qty: item.new_allocated_qty,
                batch_number: item.batch_number,
            }))
        });
    } catch (error) {
        console.error("Error fetching pickslip data:", error);
        res.status(500).json({ error: "Error fetching pickslip data" });
    }
};

const getLatestHoldingForPDF = async (req, res) => {
    const { pickslip_number } = req.params;
    try {
        console.log(`Fetching latest holding data for pickslip: ${pickslip_number}`);
        const pool = await connectToDatabase(db3);

        const result = await pool.request().query(`
             SELECT
                pickslip_number,
                pickslip_line_id,
                item_code,
                ordered_qty,
                issued_qty,
                remaining_qty,
                batch_number,
                bin_location,
                case when UPPER(new_bin_location) like '%CUST%' THEN bin_location ELSE new_bin_location END new_bin_location,
                new_allocated_qty,
                issued_at,
                created_at,
                status,
                customer_name,
                make,
                invoice_number
            FROM holding_table
          WHERE pickslip_number = '${pickslip_number}'
            and cast(issued_at as date ) in (select max(cast(issued_at as date ) ) from holding_table where pickslip_number = '${pickslip_number}')
            ORDER BY created_at DESC
        `);

        console.log("Query result:", result.recordset);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "No data found for the given pickslip number" });
        }

        const latestRecord = result.recordset[0];
        res.json({
            customer_name: latestRecord.customer_name,
            invoice_number: latestRecord.invoice_number,
            issued_at: latestRecord.issued_at,
            items: result.recordset 
        });
    } catch (error) {
        console.error("Error fetching latest holding data:", error);
        res.status(500).json({ error: "Error fetching latest holding data" });
    }
};

const getCompletedHoldingData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query(`
            select * from vw_holding where remaining_qty = 0
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching holding data:", error);
        res.status(500).json({ error: "Error fetching holding data" });
    }
};

module.exports = {
    getHoldingData,
    saveHoldingTransfer,
    getHoldingForPDF,
    getLatestHoldingForPDF,
    getCompletedHoldingData
};