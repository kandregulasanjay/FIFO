const sql = require('mssql');
const { db3, connectToDatabase } = require('../../../db');

const getAllReceipts = async (date, res) => {
    try {
        console.log(`Received date in controller: ${date}`);

        const pool = await connectToDatabase(db3);
        const query = `
            SELECT supplier_name, invoice_number, receipt_number, num_of_items, num_of_batch, quantity, receipt_date,receipt_status, receipt_type, receipt_comment
            FROM vw_pending_receipts
            WHERE (@date IS NULL OR @date = '' OR CAST(receipt_date AS DATE) = @date) 
        `;

        console.log(`Executing query with date: ${date || null}`);

        const result = await pool.request()
            .input('date', sql.VarChar, date || null)
            .query(query);

        console.log(`Query executed successfully. Rows returned: ${result.recordset.length}`); 

        res.json(result.recordset);
    } catch (error) {
        console.error("Error in getAllReceipts:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const getReceiptDetails = async (req, res) => {
    const { receipt_number } = req.params;
    console.log(`Fetching details for receipt_number: ${receipt_number}`);
    try {
        const pool = await connectToDatabase(db3);

        // Fetch receipt details from receipt_master
        const receiptResult = await pool.request()
            .input("receipt_number", sql.VarChar, receipt_number)
            .query(`
                SELECT 
                    rm.receipt_number, 
                    rm.receipt_date, 
                    rm.store, 
                    rm.make, 
                    rm.batch_number, 
                    rm.item_code, 
                    rm.quantity, 
                    rm.expiry_date,
                    rm.supplier_name
                FROM receipt_master rm
                WHERE rm.receipt_number = @receipt_number
            `);

        console.log("Query Result:", receiptResult.recordset);

        if (receiptResult.recordset.length === 0) {
            console.error("Receipt not found in the database");
            return res.status(404).json({ error: "Receipt not found" });
        }

        // Fetch receipt status, type, and comment from receipt_master_status
        const statusResult = await pool.request()
            .input("receipt_number", sql.VarChar, receipt_number)
            .query(`
                SELECT 
                    receipt_status, 
                    receipt_type, 
                    receipt_comment
                FROM receipt_master_status
                WHERE receipt_number = @receipt_number
            `);

        const statusData = statusResult.recordset[0] || {
            receipt_status: "Release", 
            receipt_type: "Release", 
            receipt_comment: null
        };

        // Fetch additional data for sections, sub-sections, and bins
        const [sectionResult, subSectionResult, binResult] = await Promise.all([
            pool.request().query(`SELECT DISTINCT section FROM bin_master WHERE bin_status = 'Active'`),
            pool.request().query(`SELECT DISTINCT section, sub_section FROM bin_master WHERE bin_status = 'Active'`),
            pool.request().query(`SELECT section, sub_section, bins FROM bin_master WITH (NOLOCK) WHERE bin_status = 'Active'`)
        ]);

        res.json({
            receipt_number: receiptResult.recordset[0].receipt_number,
            receipt_date: receiptResult.recordset[0].receipt_date,
            supplier_name: receiptResult.recordset[0].supplier_name,
            receipt_status: statusData.receipt_status,
            receipt_type: statusData.receipt_type,
            receipt_comment: statusData.receipt_comment,
            items: receiptResult.recordset.map(item => ({
                batch_number: item.batch_number,
                item_code: item.item_code,
                quantity: item.quantity,
                make: item.make,
                expiry_date: item.expiry_date,
                status: item.status
            })),
            sections: sectionResult.recordset,
            sub_sections: subSectionResult.recordset,
            bins: binResult.recordset
        });

    } catch (error) {
        console.error("Error fetching receipt details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const saveAllocation = async (req, res) => {
    const { receipt_number, batches } = req.body;

    if (!receipt_number || !batches || batches.length === 0) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    let transaction;
    const pool = await connectToDatabase(db3);

    try {
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        let totalAllocated = 0;
        let totalQuantity = 0;

        for (let batch of batches) {
            const { batch_number, item_code, allocations } = batch;
            const itemDetailsRequest = transaction.request();
            itemDetailsRequest.input("receipt_number", sql.VarChar, receipt_number);
            itemDetailsRequest.input("item_code", sql.VarChar, item_code);
            itemDetailsRequest.input("batch_number", sql.VarChar, batch_number);

            const itemDetails = await itemDetailsRequest.query(`
                    SELECT rm.supplier_name, rm.item_code, rm.expiry_date, rm.quantity, rm.batch_number,
                           '' item_description, '' item_category, rm.make
                    FROM receipt_master rm
                    WHERE rm.receipt_number = @receipt_number AND rm.item_code = @item_code AND rm.batch_number = @batch_number
                `);

            const { quantity } = itemDetails.recordset[0];
            totalQuantity += quantity;

            const allocatedQuantity = allocations.reduce((sum, alloc) => sum + alloc.allocated_quantity, 0);
            totalAllocated += allocatedQuantity;

            if (allocatedQuantity !== quantity) {
                throw new Error(`Total allocated quantity for item ${item_code} and batch ${batch_number} must be equal to ${quantity}.`);
            }

            for (let allocation of allocations) {
                let { section, sub_section, bins, bin_location, allocated_quantity } = allocation;

                // Extract section, sub_section, and bins from bin_location if not provided
                if (!section || !sub_section || !bins) {
                    if (bin_location) {
                        const parts = bin_location.split("-");
                        section = parts[0];
                        sub_section = parts[1];
                        bins = parts[2] || sub_section; 
                    } else {
                        throw new Error(`Invalid bin location: section, sub_section, or bins is missing for allocation.`);
                    }
                }

                // Validate and construct bin_location
                if (sub_section === bins) {
                    bin_location = `${section}-${sub_section}`;
                } else {
                    bin_location = `${section}-${sub_section}-${bins}`;
                }

                // Compare bin_location with bin_master
                const capacityRequest = transaction.request();
                capacityRequest.input("bin_location", sql.VarChar, bin_location);

                const capacityCheck = await capacityRequest.query(`
                    SELECT bin_capacity FROM bin_master WHERE bin_location = @bin_location
                `);

                if (capacityCheck.recordset.length === 0) {
                    throw new Error(`Invalid bin location: ${bin_location}`);
                }

                const bin_capacity = capacityCheck.recordset[0].bin_capacity;
                if (bin_capacity > 0 && allocated_quantity > bin_capacity) {
                    throw new Error(`Allocated quantity exceeds bin capacity (${bin_capacity})`);
                }

                const allocationRequest = transaction.request();
                allocationRequest.input("receipt_number", sql.VarChar, receipt_number);
                allocationRequest.input("batch_number", sql.VarChar, batch_number);
                allocationRequest.input("bin_location", sql.VarChar, bin_location);
                allocationRequest.input("allocated_quantity", sql.Int, allocated_quantity);
                allocationRequest.input("item_code", sql.VarChar, item_code);
                allocationRequest.input("expiry_date", sql.Date, itemDetails.recordset[0].expiry_date);
                allocationRequest.input("item_description", sql.VarChar, itemDetails.recordset[0].item_description);
                allocationRequest.input("item_category", sql.VarChar, itemDetails.recordset[0].item_category);
                allocationRequest.input("quantity", sql.Int, itemDetails.recordset[0].quantity);
                allocationRequest.input("supplier_name", sql.VarChar, itemDetails.recordset[0].supplier_name);
                allocationRequest.input("make", sql.VarChar, itemDetails.recordset[0].make);
                await allocationRequest.query(`
                    INSERT INTO allocation_table 
                    (receipt_number, batch_number, bin_location, allocated_quantity, item_code, expiry_date, 
                     item_description, item_category, quantity, store, created_at, supplier_name, make)
                    VALUES 
                    (@receipt_number, @batch_number, @bin_location, @allocated_quantity, @item_code, @expiry_date, 
                     @item_description, @item_category, @quantity, 13, GETDATE(), @supplier_name, @make)
                `);
            }

            const logRequest = transaction.request();
            logRequest.input("receipt_number", sql.VarChar, receipt_number);
            logRequest.input("item_code", sql.VarChar, item_code);
            await logRequest.query(`
                INSERT INTO receipt_master_log (receipt_id, store, receipt_number, receipt_date, batch_number, item_code, quantity, expiry_date, supplier_name, created_at, trans_date, make)
                SELECT receipt_id, store, receipt_number, receipt_date, batch_number, item_code, quantity, expiry_date, supplier_name, GETDATE(), GETDATE(), make
                FROM receipt_master
                WHERE receipt_number = @receipt_number AND item_code = @item_code
            `);
        }

        if (totalAllocated !== totalQuantity) {
            throw new Error(`Total allocated quantity (${totalAllocated}) must be equal to total quantity (${totalQuantity}).`);
        }

        await transaction.commit();
        res.json({ message: "Allocations saved successfully!" });

    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
        }
        console.error("Error in saveAllocation:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const updateReceiptDetails = async (req, res) => {
    const { receipt_number, receipt_status, receipt_type, receipt_comment } = req.body;

    if (!receipt_number || typeof receipt_number !== 'string' || receipt_number.trim() === '') {
        return res.status(400).json({ success: false, error: "Invalid or missing required field: receipt_number" });
    }

    try {
        const pool = await connectToDatabase(db3);

        await pool.request()
            .input("receipt_number", sql.VarChar, receipt_number.trim()) 
            .input("receipt_status", sql.VarChar, receipt_status) 
            .input("receipt_type", sql.VarChar, receipt_type) 
            .input("receipt_comment", sql.VarChar, receipt_comment)
            .query(`
                MERGE receipt_master_status AS target
                USING (SELECT @receipt_number AS receipt_number) AS source
                ON target.receipt_number = source.receipt_number
                WHEN MATCHED THEN
                    UPDATE SET 
                        receipt_status = @receipt_status,
                        receipt_type = @receipt_type,
                        receipt_comment = @receipt_comment
                WHEN NOT MATCHED THEN
                    INSERT (receipt_number, receipt_status, receipt_type, receipt_comment)
                    VALUES (@receipt_number, @receipt_status, @receipt_type, @receipt_comment);
            `);

        res.json({ success: true, message: "Receipt details updated successfully!" });
    } catch (error) {
        console.error("Error updating receipt details:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

const getReceiptForPDF = async (req, res) => {
    const { receipt_number } = req.params;
    let pool;
    try {
        pool = await connectToDatabase(db3);

        const receiptResult = await pool.request().query(`
            SELECT 
                receipt_number, 
                batch_number, 
                item_code, 
                item_description, 
                item_category, 
                allocated_quantity, 
                quantity, 
                bin_location, 
                store, 
                expiry_date, 
                supplier_name, 
                make, 
                CONVERT(VARCHAR, created_at, 120) AS created_at 
            FROM allocation_table
            WHERE receipt_number = '${receipt_number}'
            ORDER BY item_code, batch_number, bin_location;
        `);

        if (receiptResult.recordset.length === 0) {
            return res.status(404).json({ error: "Receipt not found" });
        }

        res.json({
            receipt_number: receipt_number,
            supplier_name: receiptResult.recordset[0].supplier_name,
            allocation_date: receiptResult.recordset[0].created_at,
            items: receiptResult.recordset.map(item => ({
                batch_number: item.batch_number,
                item_code: item.item_code,
                item_description: item.item_description,
                item_category: item.item_category,
                allocated_quantity: item.allocated_quantity,
                bin_location: item.bin_location,
                expiry_date: item.expiry_date || "N/A",
                store: item.store,
                make: item.make
            }))
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllReceipts,
    getReceiptDetails,
    saveAllocation,
    getReceiptForPDF,
    updateReceiptDetails
};
