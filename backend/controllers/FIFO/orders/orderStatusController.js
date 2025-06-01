const sql = require('mssql');
const { db3, connectToDatabase } = require("../../../db");

const updateOrderStatus = async (req, res) => {
    const { pickslipNumber, pickslipStatus } = req.body;

    if (!pickslipNumber || !pickslipStatus) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const pool = await connectToDatabase(db3);
        const request = pool.request();
        request.input("pickslipNumber", sql.VarChar, pickslipNumber);
        request.input("pickslipStatus", sql.VarChar, pickslipStatus);

        await request.query(`
            MERGE INTO order_master_status AS target
            USING (SELECT @pickslipNumber AS pickslip_number, @pickslipStatus AS pickslip_status) AS source
            ON target.pickslip_number = source.pickslip_number
            WHEN MATCHED THEN
                UPDATE SET target.pickslip_status = source.pickslip_status
            WHEN NOT MATCHED THEN
                INSERT (pickslip_number, pickslip_status)
                VALUES (source.pickslip_number, source.pickslip_status);
        `);

        res.json({ success: true, message: "Order status updated successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    updateOrderStatus
};
