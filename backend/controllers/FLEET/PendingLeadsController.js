const sql = require('mssql');
const { db3, connectToDatabase } = require('../../db');

const getAllLeads = async (date, res) => {
    try {
        console.log(`Received date in controller: ${date}`);

        const pool = await connectToDatabase(db3);
        const query = `
            SELECT 
                l.LeadID,
                l.CompanyName,
                CONCAT(CONCAT(CONCAT(l.Brand, ' '), l.Variant, ' '), l.ModelYear) AS Vehicle,
                CONCAT(CONCAT(l.ContactPhone, ' '), l.ContactName, ' ') AS Contact,
                l.Qty AS Quantity,
                l.LeadType,
                l.AdditionalInfo,
                lm.lead_status,
                lm.lead_type,
                lm.lead_followup_date,
                lm.lead_comment
            FROM Lead l
            LEFT JOIN lead_master_status lm ON l.LeadID = lm.LeadID
            WHERE (@date IS NULL OR @date = '' OR CAST(l.CreatedAt AS DATE) = CAST(@date AS DATE))
        `;

        console.log(`Executing query with date: ${date || null}`);

        const result = await pool.request()
            .input('date', sql.VarChar, date || null)
            .query(query);

        console.log(`Query executed successfully. Rows returned: ${result.recordset.length}`);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error in getAllLeads:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const updateLeadDetails = async (req, res) => {
    const { LeadID, lead_status, lead_type, lead_followup_date, lead_comment } = req.body;

    console.log("Received data in API:", { LeadID, lead_status, lead_type, lead_followup_date, lead_comment });

    if (!LeadID) {
        return res.status(400).json({ success: false, error: "Missing required field: LeadID" });
    }    

    try {
        const pool = await connectToDatabase(db3);
        const parsedDate = lead_followup_date ? new Date(lead_followup_date) : null;

        await pool.request()
            .input("LeadID", sql.VarChar, String(LeadID).trim())
            .input("lead_status", sql.VarChar, lead_status)
            .input("lead_type", sql.VarChar, lead_type)
            .input("lead_followup_date", sql.DateTime, parsedDate)
            .input("lead_comment", sql.VarChar, lead_comment)
            .query(`
                MERGE lead_master_status AS target
                USING (SELECT @LeadID AS LeadID) AS source
                ON target.LeadID = source.LeadID
                WHEN MATCHED THEN
                    UPDATE SET 
                        lead_status = @lead_status,
                        lead_type = @lead_type,
                        lead_followup_date = @lead_followup_date,
                        lead_comment = @lead_comment
                WHEN NOT MATCHED THEN
                    INSERT (LeadID, lead_status, lead_type, lead_followup_date, lead_comment)
                    VALUES (@LeadID, @lead_status, @lead_type, @lead_followup_date, @lead_comment);
            `);

        res.json({ success: true, message: "Lead details updated successfully!" });
    } catch (error) {
        console.error("Error updating Lead details:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

const getDropdownData = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);

        // Fetch lead_status and lead_type data
        const leadStatusResult = await pool.request().query(`
            SELECT LeadTypeID AS id, Type AS name FROM LeadType
        `);
        const leadTypeResult = await pool.request().query(`
            SELECT LeadTypeID AS id, Type AS name FROM LeadType
        `);

        res.json({
            leadStatus: leadStatusResult.recordset,
            leadType: leadTypeResult.recordset,
        });
    } catch (error) {
        console.error("Error fetching dropdown data:", error.message);
        res.status(500).json({ error: "Failed to fetch dropdown data" });
    }
};

module.exports = {
    getAllLeads,
    updateLeadDetails,
    getDropdownData,
};
