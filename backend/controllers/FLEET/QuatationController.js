const { db3, connectToDatabase } = require("../../db");
const sql = require("mssql");

exports.createQuote= async (req, res) => {
    const {
        salesman,
        companyName,
        businessType,
        customerType,
        address1,
        address2,
        city,
        country,
        postalcode,
        leadType,
        contactName,
        contactPhone,
        role,
        leadDate,
        overallComments,
        vehicleDetails, 
    } = req.body;

    try {
        const pool = await connectToDatabase(db3);

        // Insert each vehicle detail as a separate row in the Lead table
        const QuoteQuery = `
            INSERT INTO Quote (
                Salesman, CompanyName, BusinessType, CustomerType, address1,address2,city,country,postalcode, ContactName, ContactPhone, Role,
                Brand, Variant, SubVariant, ModelYear, Qty, AdditionalInfo, LeadDate, OverallComments
            )
            VALUES (
                @salesman, @companyName, @businessType, @customerType, @address1,@address2,@city,@country,@postalcode, @contactName, @contactPhone, @role,
                @brand, @variant, @subVariant, @modelYear, @qty, @additionalInfo, @leadDate, @overallComments
            )
        `;

        for (const vehicle of vehicleDetails) {
            await pool.request()
                .input("salesman", sql.NVarChar, salesman)
                .input("companyName", sql.NVarChar, companyName)
                .input("businessType", sql.NVarChar, businessType)
                .input("customerType", sql.NVarChar, customerType)
                .input("address1", sql.NVarChar, address1)
                .input("address2", sql.NVarChar, address2)
                .input("city", sql.NVarChar, city)
                .input("country", sql.NVarChar, country)
                .input("postalcode", sql.NVarChar, postalcode)
                .input("contactName", sql.NVarChar, contactName)
                .input("contactPhone", sql.NVarChar, contactPhone)
                .input("role", sql.NVarChar, role)
                .input("brand", sql.NVarChar, vehicle.brand)
                .input("variant", sql.NVarChar, vehicle.variant)
                .input("subVariant", sql.NVarChar, vehicle.subVariant)
                .input("modelYear", sql.Int, vehicle.modelYear)
                .input("qty", sql.Int, vehicle.qty)
                .input("additionalInfo", sql.NVarChar, vehicle.additionalInfo)
                .input("leadDate", sql.Date, leadDate)
                .input("overallComments", sql.NVarChar, overallComments)
                .query(QuoteQuery);
        }

        res.status(201).json({ message: "Quote created successfully!" });
    } catch (error) {
        console.error("Error creating Quote:", error.message);
        res.status(500).json({ error: "Failed to create lead." });
    }
};