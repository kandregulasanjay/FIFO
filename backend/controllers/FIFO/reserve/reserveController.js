const { connectToDatabase, db3 } = require('../../../db');

let pool;
(async () => {
    pool = await connectToDatabase(db3);
})();

exports.getReserveData = async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM receipt_master_status where receipt_status = \'Reserve\'');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching reserve data:', error);
        res.status(500).json({ error: 'Failed to fetch reserve data' });
    }
};

exports.transferReserve = async (req, res) => {
    const { receipt_number } = req.body;
    try {
        const transferDate = new Date();

        // Insert into reserve_table with transfer_date
        await pool.request()
            .input('receipt_number', receipt_number)
            .input('transfer_date', transferDate)
            .query(`
                INSERT INTO reserve_table (receipt_number, receipt_status, receipt_type, receipt_comment, transfer_date) 
                SELECT receipt_number, receipt_status, receipt_type, receipt_comment, @transfer_date 
                FROM receipt_master_status 
                WHERE receipt_number = @receipt_number
            `);

        // Update receipt_master_status to ReserveRelease
        await pool.request()
            .input('receipt_number', receipt_number)
            .query(`
                UPDATE receipt_master_status 
                SET receipt_status = 'ReserveRelease', receipt_type = 'ReserveRelease' 
                WHERE receipt_number = @receipt_number
            `);

        res.status(200).json({ message: 'Transfer successful' });
    } catch (error) {
        console.error('Error transferring reserve:', error);
        res.status(500).json({ error: 'Failed to transfer reserve' });
    }
};

exports.getReserveReleaseData = async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM receipt_master_status where receipt_status = \'ReserveRelease\'');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching reserve data:', error);
        res.status(500).json({ error: 'Failed to fetch reserve release data' });
    }
};
