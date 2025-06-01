const { db3, connectToDatabase } = require('../../../db');

const getPickslipExceptionData = async (req, res) => {
    try {
        const { pickslip_number } = req.query;
        const pool = await connectToDatabase(db3);
        let query = 'SELECT * FROM order_master';
        if (pickslip_number) {
            query += ` WHERE pickslip_number = '${pickslip_number}'`;
        }
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getReceiptExceptionData = async (req, res) => {
  try {
    const { receipt_number } = req.query;
    const pool = await connectToDatabase(db3);
    let query = 'SELECT * FROM receipt_master';
    if (receipt_number) {
      query += ` WHERE receipt_number = '${receipt_number}'`;
    }
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getHoldingReportData = async (req, res) => {
  try {
    const { invoice_number } = req.query;
    const pool = await connectToDatabase(db3);
    let query = 'SELECT * FROM holding_release_table';
    if (invoice_number) {
      query += ` WHERE invoice_number = '${invoice_number}'`;
    }
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
    getReceiptExceptionData,
    getPickslipExceptionData,
    getHoldingReportData
};

