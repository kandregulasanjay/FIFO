const sql = require('mssql');
const { db3, connectToDatabase } = require('../../../db');

const getHoldingData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query(`
SELECT 
pickslip_number,
invoice_number,
COUNT(DISTINCT pickslip_line_id) AS num_line_id,
COUNT(DISTINCT item_code) AS num_of_items,
SUM(quantity) AS qty,
CAST(order_date AS date) AS order_date
FROM 
order_master 
WHERE 
pickslip_number IN (SELECT pickslip_number  FROM order_master_status  WHERE pickslip_status = 'Holding')
and pickslip_number IN (SELECT pickslip_number  FROM issued_stock_table  )
GROUP BY 
pickslip_number, 
invoice_number,
CAST(order_date AS date)`);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching holding data:", error);
        res.status(500).json({ error: "Error fetching holding data" });
    }
};

const getHoldingDetails = async (req, res) => {
    const { invoice_number } = req.params;
    console.log(`Fetching details for invoice_number: ${invoice_number}`);
    try {
        const pool = await connectToDatabase(db3);

        const holdingResult = await pool.request()
            .input("invoice_number", sql.VarChar, invoice_number)
            .query(`
select 
pickslip_number ,
pickslip_line_id,
invoice_number,
customer_name,
make,
item_code,
batch_number,
bin_location,
pending_qty
from 
(
select 
isnull(i.pickslip_number ,hr.pickslip_number) pickslip_number,
isnull(i.pickslip_line_id, hr.pickslip_line_id) pickslip_line_id,
isnull(i.invoice_number, hr.invoice_number) invoice_number,
i.customer_name,
isnull(i.make, hr.make) make,
isnull(i.item_code,hr.item_code) item_code,
isnull(i.batch_number ,hr.batch_number) batch_number,
isnull(i.bin_location ,hr.new_bin_location)  bin_location,
row_number ()  over (partition by isnull(i.pickslip_number ,hr.pickslip_number) ,
isnull(i.pickslip_line_id, hr.pickslip_line_id) ,
isnull(i.invoice_number, hr.invoice_number) ,
isnull(i.make, hr.make) ,
isnull(i.item_code,hr.item_code) ,
isnull(i.batch_number ,hr.batch_number)  order by isnull(i.pickslip_number ,hr.pickslip_number) ) r1,
case when hr.pickslip_number is null then i.issued_quantity else  
max(ordered_qty) over (partition by isnull(i.pickslip_number ,hr.pickslip_number) ,
isnull(i.pickslip_line_id, hr.pickslip_line_id) ,
isnull(i.invoice_number, hr.invoice_number) ,
isnull(i.make, hr.make) ,
isnull(i.item_code,hr.item_code) ,
isnull(i.batch_number ,hr.batch_number) ) -
sum(issued_qty) over (partition by isnull(i.pickslip_number ,hr.pickslip_number) ,
isnull(i.pickslip_line_id, hr.pickslip_line_id) ,
isnull(i.invoice_number, hr.invoice_number) ,
isnull(i.make, hr.make) ,
isnull(i.item_code,hr.item_code) ,
isnull(i.batch_number ,hr.batch_number) )
end pending_qty
from 
(
SELECT
pickslip_number ,
pickslip_line_id,
invoice_number,
customer_name,
make,
item_code,
batch_number ,
bin_location ,
sum(issued_quantity) issued_quantity
FROM issued_stock_table
WHERE invoice_number = @invoice_number
group by
pickslip_number ,
invoice_number,
make,
customer_name,
item_code,
batch_number ,
bin_location,
pickslip_line_id
) i
left outer join 
(
select * from holding_release_table 
where  invoice_number =  @invoice_number
--where  invoice_number = 'ADS51X546'
) HR
ON HR.PICKSLIP_NUMBER = I.pickslip_number
AND HR.pickslip_line_id = I.pickslip_line_id 
and  HR.ITEM_CODE = I.ITEM_CODE 
AND HR.MAKE = I.MAKE 
AND HR.BATCH_NUMBER = I.BATCH_NUMBER
)
m 
where r1 =1 `);

        console.log("Query Result:", holdingResult.recordset);

        if (holdingResult.recordset.length === 0) {
            console.error("holding not found in the database");
            return res.status(404).json({ error: "holding not found" });
        }

        // Fetch additional data for sections, sub-sections, and bins
        const [sectionResult, subSectionResult, binResult] = await Promise.all([
            pool.request().query(`SELECT DISTINCT section FROM bin_master WHERE bin_status = 'Active'`),
            pool.request().query(`SELECT DISTINCT section, sub_section FROM bin_master WHERE bin_status = 'Active'`),
            pool.request().query(`SELECT section, sub_section, bins FROM bin_master WHERE bin_status = 'Active'`)
        ]);

        res.json({
            pickslip_number: holdingResult.recordset[0].pickslip_number,
            order_date: holdingResult.recordset[0].order_date,
            issued_at: holdingResult.recordset[0].issued_at,
            customer_name: holdingResult.recordset[0].customer_name,
            items: holdingResult.recordset.map(item => ({
                pickslip_line_id: item.pickslip_line_id,
                batch_number: item.batch_number,
                item_code: item.item_code,
                ordered_qty: item.pending_qty,
                issued_qty: 0,
                remaining_qty: item.pending_qty, 
                make: item.make,
                bin_location: item.bin_location,
                issued_at : item.issued_at,
                customer_name: item.customer_name,
            })),
            sections: sectionResult.recordset,
            sub_sections: subSectionResult.recordset,
            bins: binResult.recordset
        });

    } catch (error) {
        console.error("Error fetching holding details:", error);
        res.status(500).json({ error: "Internal Server Error" });
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
                bin_location, new_bin_location, new_allocated_qty, status, ordered_qty, invoice_number
            } = transfer;

            if (!pickslip_number || !pickslip_line_id || !make || !item_code || !batch_number || !bin_location ||
                !new_bin_location || new_allocated_qty === undefined  || issued_qty === undefined ||
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
            request.input("status", sql.VarChar, status || "Pending");
            request.input("ordered_qty", sql.Int, ordered_qty);
            request.input("invoice_number", sql.VarChar, invoice_number);

            await request.query(`
                INSERT INTO holding_release_table (pickslip_number, pickslip_line_id, make, item_code, issued_qty, remaining_qty, 
                    batch_number, bin_location, new_bin_location, new_allocated_qty, status, ordered_qty, invoice_number) 
                VALUES (@pickslip_number, @pickslip_line_id, @make, @item_code, @issued_qty, @remaining_qty, @batch_number, 
                    @bin_location, @new_bin_location, @new_allocated_qty, @status, @ordered_qty, @invoice_number)
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
    const { invoice_number } = req.params;
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request()
            .input('invoice_number', sql.VarChar, invoice_number)
            .query(`SELECT * FROM holding_release_table WHERE invoice_number = @invoice_number`);
        if (!result.recordset.length) {
            return res.status(404).json({ error: "No data found for this invoice_number" });
        }
        res.json({
            invoice_number,
            items: result.recordset
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching holding PDF data" });
    }
};

const getLatestHoldingForPDF = async (req, res) => {
    const { invoice_number } = req.params;
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request()
            .input('invoice_number', sql.VarChar, invoice_number)
            .query(`SELECT * FROM holding_release_table WHERE invoice_number = @invoice_number ORDER BY created_at DESC`);
        if (!result.recordset.length) {
            return res.status(404).json({ error: "No data found for this invoice_number" });
        }
        res.json({
            invoice_number,
            created_at: result.recordset[0].created_at,
            items: result.recordset
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching latest holding PDF data" });
    }
};

const getCompletedHoldingData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query(`
            select * from order_master 
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching holding data:", error);
        res.status(500).json({ error: "Error fetching holding data" });
    }
};

module.exports = {
    getHoldingData,
    getHoldingDetails,
    saveHoldingTransfer,
    getHoldingForPDF,
    getLatestHoldingForPDF,
    getCompletedHoldingData
};