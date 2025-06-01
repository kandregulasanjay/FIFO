const {  db3, connectToDatabase } = require('../../db');

exports.getAllReports = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query("SELECT * FROM report_table");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.runReportQuery = async (req, res) => {
    const reportId = req.params.id;
    const filters = req.body;

    // console.log("Received Filters:", filters); 

    try {
        const pool = await connectToDatabase(db3);
        const reportResult = await pool.request().query(`SELECT * FROM report_table WHERE id = ${reportId}`);
        const report = reportResult.recordset[0];

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        let query = report.report_query;

        const whereConditions = [];
        for (let i = 1; i <= 10; i++) {
            const filterKey = `filter${i}`;
            const filterTypeKey = `${filterKey}_type`;

            if (report[filterKey] && filters[filterKey] !== undefined && filters[filterKey] !== "") {
                const value = filters[filterKey];
                let condition;

                if (report[filterTypeKey] === "dropdown" || report[filterTypeKey] === "text") {
                    condition = `${report[filterKey]} = '${value}'`; // Add quotes for text values
                } else if (report[filterTypeKey] === "date") {
                    condition = `${report[filterKey]} = '${value}'`; // Format date as string
                } else {
                    condition = `${report[filterKey]} = ${value}`; // Numeric values
                }

                whereConditions.push(condition);
            }
        }

        // Append WHERE clause only if there are valid conditions
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(" AND ")}`;
        }

        // console.log("Final Query:", query); // Log the final query for debugging

        const dataResult = await pool.request().query(query);
        res.json({
            columns: Object.keys(dataResult.recordset[0] || {}),
            rows: dataResult.recordset,
        });
    } catch (err) {
        console.error("Error executing report query:", err.message);
        res.status(500).json({ error: "Error executing report query" });
    }
};

exports.getReportMenus = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query("SELECT menu, sub_menu, report_name FROM report_table");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.getFilterOptions = async (req, res) => {
    const { field, table } = req.query;

    if (!field || !table) {
        return res.status(400).json({ error: "Field and table are required parameters." });
    }

    const tableName = table.replace(/[^a-zA-Z0-9_]/g, ''); // Sanitize table name

    try {
        const pool = await connectToDatabase(db3);

        if (field === "*") {
            // Fetch all column names from the table
            const query = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'`;
            const result = await pool.request().query(query);
            const columns = result.recordset.map((row) => row.COLUMN_NAME);
            return res.json(columns);
        } else {
            // Fetch distinct values for the specified field
            const fieldName = field.replace(/[^a-zA-Z0-9_]/g, ''); // Sanitize field name
            const query = `SELECT DISTINCT [${fieldName}] FROM [${tableName}]`;
            const result = await pool.request().query(query);
            const options = result.recordset.map((row) => row[fieldName]);
            return res.json(options);
        }
    } catch (error) {
        console.error("Error fetching filter options:", error.message);
        res.status(500).json({ error: "Failed to fetch filter options." });
    }
};