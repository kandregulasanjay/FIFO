const sql = require('mssql');
const { db3, connectToDatabase } = require('../../../db');

const getPickslipReportData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query('SELECT * FROM vw_availability'); 
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching Pickslip report data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getAllPendingOrders = async (date, res) => {
    try {
        console.log(`Received date in controller: ${date}`);

        const pool = await connectToDatabase(db3);
        const query = `
            SELECT
                *
            FROM vw_pending_orders
            WHERE (@date IS NULL OR @date = '' OR CAST(order_date AS DATE) = @date) -- Match exact date
        `;

        console.log(`Executing query with date: ${date || null}`);

        const result = await pool.request()
            .input('date', sql.VarChar, date || null)
            .query(query);

        console.log(`Query executed successfully. Rows returned: ${result.recordset.length}`); // Debug log

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching pending orders:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const getOrderDetailsByOrderNumber = async (req, res) => {
    const { pickslipNumber } = req.params;
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request()
            .input("pickslipNumber", sql.VarChar, pickslipNumber)
            .query(`
                SELECT
                pickslip_number Pickslip_Num ,
                invoice_number Invoice_Num,
                make Make,
                item_code Item_Code,
                Batch_number Batch_Num,
                bin_location Bin_Location,
                pickslip_quantity Pickslip_Qty,
                available_qty Available_Qty,
                issued_qty Issued_Qty,
                case when not_available_flag ='Y' then 'No' else 'Yes' end   Available
                FROM
                (
                SELECT *,
                CASE  WHEN SUM(available_qty) OVER (PARTITION BY pickslip_number, item_code, batch_number) < pickslip_quantity  THEN 'Y' ELSE 'N'  END AS not_available_flag,
                CASE  WHEN SUM(available_qty) OVER (PARTITION BY pickslip_number, item_code, batch_number ORDER BY bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING ) >= pickslip_quantity  THEN 'Y' ELSE 'N' END AS not_required_flag
                FROM (
                SELECT
                om.pickslip_number,
                om.invoice_number,
                om.make,
                om.item_code,
                i.item_description,
                om.quantity AS pickslip_quantity,
                a.bin_location,
                ISNULL(a.available_quantity, 0) AS available_qty,
                CASE WHEN om.quantity <= SUM(ISNULL(a.available_quantity, 0)) OVER (PARTITION BY om.make, om.item_code, om.batch_number  ORDER BY a.bin_location  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - ISNULL(a.available_quantity, 0)  THEN 0
                WHEN om.quantity <= SUM(ISNULL(a.available_quantity, 0)) OVER ( PARTITION BY om.pickslip_number, om.item_code, om.batch_number  ORDER BY a.bin_location  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
                THEN om.quantity - (SUM(ISNULL(a.available_quantity, 0)) OVER (PARTITION BY om.make, om.item_code, om.batch_number ORDER BY a.bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - ISNULL(a.available_quantity, 0)) ELSE ISNULL(a.available_quantity, 0) END AS issued_qty,
                        om.batch_number,
                        om.customer_name,
                        om.order_date
                    FROM order_master om
                        LEFT JOIN item_master i
                            ON i.item_code = om.item_code AND i.item_brand = om.make
                        LEFT JOIN 
            (select * from dbo.vw_availability  where available_quantity > 0 )  a
                            ON om.item_code = a.item_code AND om.make = a.make AND om.batch_number = a.batch_number
                    WHERE om.pickslip_number = @pickslipNumber
                ) m
                ) MM WHERE not_required_flag ='N'
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Order details not found" });
        }
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPickslipForPDF = async (req, res) => {
    const { pickslipNumber } = req.params;
    let pool;
    try {
        pool = await connectToDatabase(db3);

        const pickslipResult = await pool.request()
            .input("pickslipNumber", sql.VarChar, pickslipNumber)
            .query(`
                SELECT
                    invoice_number,
                    pickslip_number,
                    item_code,
                    batch_number,
                    bin_location,
                    issued_quantity,
                    issued_at,
                    make,
                    customer_name
                FROM issued_stock_table
                WHERE pickslip_number = @pickslipNumber
            `);

        if (pickslipResult.recordset.length === 0) {
            return res.status(404).json({ error: "pickslip not found" });
        }

        res.json({
            pickslip_number: pickslipNumber,
            invoice_number: pickslipResult.recordset[0].invoice_number,
            customer_name: pickslipResult.recordset[0].customer_name,
            issued_at: pickslipResult.recordset[0].issued_at,
            items: pickslipResult.recordset.map(item => ({
                batch_number: item.batch_number,
                item_code: item.item_code,
                issued_quantity: item.issued_quantity,
                bin_location: item.bin_location,
                make: item.make,
                invoice_number: item.invoice_number
            }))
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const completeOrder = async (req, res) => {
    const { pickslipNumber } = req.body;
    let transaction;

    try {
        const pool = await connectToDatabase(db3);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Step 1: Check availability
        const availabilityCheckResult = await transaction.request()
            .input("pickslipNumber", sql.VarChar, pickslipNumber)
            .query(`
                Select 
                Count(1) available_cnt 
                FROM
                (
                SELECT *,
                CASE  WHEN SUM(available_qty) OVER (PARTITION BY pickslip_number, item_code, batch_number) < pickslip_quantity  THEN 'Y' ELSE 'N'  END AS not_available_flag,
                CASE  WHEN SUM(available_qty) OVER (PARTITION BY pickslip_number, item_code, batch_number ORDER BY bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING ) >= pickslip_quantity  THEN 'Y' ELSE 'N' END AS not_required_flag
                FROM (
                SELECT
                om.pickslip_number,
                om.invoice_number,
                om.make,
                om.item_code,
                i.item_description,
                om.quantity AS pickslip_quantity,
                a.bin_location,
                ISNULL(a.available_quantity, 0) AS available_qty,
                CASE WHEN om.quantity <= SUM(ISNULL(a.available_quantity, 0)) OVER (PARTITION BY om.make, om.item_code, om.batch_number  ORDER BY a.bin_location  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - ISNULL(a.available_quantity, 0)  THEN 0
                WHEN om.quantity <= SUM(ISNULL(a.available_quantity, 0)) OVER ( PARTITION BY om.pickslip_number, om.item_code, om.batch_number  ORDER BY a.bin_location  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
                THEN om.quantity - (SUM(ISNULL(a.available_quantity, 0)) OVER (PARTITION BY om.make, om.item_code, om.batch_number ORDER BY a.bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - ISNULL(a.available_quantity, 0)) ELSE ISNULL(a.available_quantity, 0) END AS issued_qty,
                        om.batch_number,
                        om.customer_name,
                        om.order_date
                    FROM order_master om
                        LEFT JOIN item_master i
                            ON i.item_code = om.item_code AND i.item_brand = om.make
                        LEFT JOIN 
                        (select * from dbo.vw_availability  where available_quantity > 0 )  a
                            ON om.item_code = a.item_code AND om.make = a.make AND om.batch_number = a.batch_number
                    WHERE om.pickslip_number = @pickslipNumber
                ) m
                ) MM
                WHERE not_available_flag ='Y'
            `);

        const { available_cnt } = availabilityCheckResult.recordset[0];
        if (available_cnt > 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Some items are not available for allocation." });
        }

        // Fetch allocation details
        const allocationQueryResult = await transaction.request()
            .input("pickslipNumber", sql.VarChar, pickslipNumber)
            .query(`
                SELECT
                        pickslip_number Pickslip_Num,
                        pickslip_line_id,
                        item_code Item_Code,
                        issued_qty Issued_Qty,
                        Batch_number Batch_Num,
                        bin_location Bin_Location,
                        getdate() issued_at,
                        'Pending' status,
                        customer_name,
                        invoice_number Invoice_Num,
                        make Make
                    FROM (
                        SELECT *,
                            CASE WHEN SUM(available_qty) OVER (PARTITION BY pickslip_number, item_code, batch_number) < pickslip_quantity THEN 'Y' ELSE 'N' END AS not_available_flag,
                            CASE WHEN SUM(available_qty) OVER (PARTITION BY pickslip_number, item_code, batch_number ORDER BY bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) >= pickslip_quantity THEN 'Y' ELSE 'N' END AS not_required_flag
                        FROM (
                            SELECT
                                om.pickslip_number,
                                om.pickslip_line_id,
                                om.invoice_number,
                                om.make,
                                om.item_code,
                                i.item_description,
                                om.quantity AS pickslip_quantity,
                                a.bin_location,
                                ISNULL(a.available_quantity, 0) AS available_qty,
                                CASE WHEN om.quantity <= SUM(ISNULL(a.available_quantity, 0)) OVER (PARTITION BY om.make, om.item_code, om.batch_number ORDER BY a.bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - ISNULL(a.available_quantity, 0) THEN 0
                                     WHEN om.quantity <= SUM(ISNULL(a.available_quantity, 0)) OVER (PARTITION BY om.pickslip_number, om.item_code, om.batch_number ORDER BY a.bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
                                     THEN om.quantity - (SUM(ISNULL(a.available_quantity, 0)) OVER (PARTITION BY om.make, om.item_code, om.batch_number ORDER BY a.bin_location ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - ISNULL(a.available_quantity, 0))
                                     ELSE ISNULL(a.available_quantity, 0) END AS issued_qty,
                                om.batch_number,
                                om.customer_name,
                                om.order_date
                            FROM order_master om
                            LEFT JOIN item_master i
                                ON i.item_code = om.item_code AND i.item_brand = om.make
                            LEFT JOIN (SELECT * FROM dbo.vw_availability WHERE available_quantity > 0) a
                                ON om.item_code = a.item_code AND om.make = a.make AND om.batch_number = a.batch_number
                            WHERE om.pickslip_number = @pickslipNumber
                        ) m
                    ) MM WHERE not_required_flag = 'N'
            `);

        // Step 3: Insert issued records
        for (const row of allocationQueryResult.recordset) {
            await transaction.request()
                .input("pickslip_number", sql.VarChar, row.Pickslip_Num)
                .input("pickslip_line_id", sql.Int, row.pickslip_line_id)
                .input("make", sql.VarChar, row.Make)
                .input("item_code", sql.VarChar, row.Item_Code)
                .input("batch_number", sql.VarChar, row.Batch_Num)
                .input("bin_location", sql.VarChar, row.Bin_Location)
                .input("issued_quantity", sql.Int, row.Issued_Qty)
                .input("issued_at", sql.DateTime, row.issued_at)
                .input("status", sql.VarChar, row.status)
                .input("customer_name", sql.VarChar, row.customer_name)
                .input("invoice_number", sql.VarChar, row.Invoice_Num)
                .query(`
                    INSERT INTO issued_stock_table (
                        pickslip_number,
                        pickslip_line_id,
                        make,
                        item_code,
                        batch_number,
                        bin_location,
                        issued_quantity,
                        issued_at,
                        status,
                        customer_name,
                        invoice_number
                    )
                    VALUES (
                        @pickslip_number,
                        @pickslip_line_id,
                        @make,
                        @item_code,
                        @batch_number,
                        @bin_location,
                        @issued_quantity,
                        @issued_at,
                        @status,
                        @customer_name,
                        @invoice_number
                    )
                `);
        }

        // Step 4: Log order master
        await transaction.request()
            .input("pickslipNumber", sql.VarChar, pickslipNumber)
            .query(`
                INSERT INTO order_master_log (
                    order_id,
                    store,
                    pickslip_number,
                    pickslip_line_id,
                    make,
                    item_code,
                    batch_number,
                    quantity,
                    order_date,
                    customer_name,
                    customer_number,
                    pickslip_status,
                    invoice_number
                )
                SELECT
                    order_id,
                    store,
                    pickslip_number,
                    pickslip_line_id,
                    make,
                    item_code,
                    batch_number,
                    quantity,
                    order_date,
                    customer_name,
                    customer_number,
                    pickslip_status,
                    invoice_number
                FROM order_master
                WHERE pickslip_number = @pickslipNumber
            `);

        await transaction.commit();
        return res.json({ success: true, message: "Order fully issued" });

    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Rollback Error:", rollbackError);
            }
        }
        console.error("Error in completeOrder:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getAllPendingOrders,
    getOrderDetailsByOrderNumber,
    completeOrder,
    getPickslipForPDF,
    getPickslipReportData
};
