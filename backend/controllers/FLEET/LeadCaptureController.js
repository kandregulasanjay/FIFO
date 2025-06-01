const { db3, connectToDatabase } = require("../../db");
const sql = require("mssql");
exports.createLead = async (req, res) => {
    const {
        salesman,
        companyName,
        businessType,
        customerType,
        leadSource,
        leadType,
        contactName,
        contactPhone,
        role,
        leadDate,
        overallComments,
        vehicleDetails, // Array of vehicle details
    } = req.body;

    try {
        const pool = await connectToDatabase(db3);

        // Insert each vehicle detail as a separate row in the Lead table
        const leadQuery = `
            INSERT INTO Lead (
                Salesman, CompanyName, BusinessType, CustomerType, LeadSource, LeadType, ContactName, ContactPhone, Role,
                Brand, Variant, SubVariant, ModelYear, Qty, AdditionalInfo, LeadDate, OverallComments
            )
            VALUES (
                @salesman, @companyName, @businessType, @customerType, @leadSource, @leadType, @contactName, @contactPhone, @role,
                @brand, @variant, @subVariant, @modelYear, @qty, @additionalInfo, @leadDate, @overallComments
            )
        `;

        for (const vehicle of vehicleDetails) {
            await pool.request()
                .input("salesman", sql.NVarChar, salesman)
                .input("companyName", sql.NVarChar, companyName)
                .input("businessType", sql.NVarChar, businessType)
                .input("customerType", sql.NVarChar, customerType)
                .input("leadSource", sql.NVarChar, leadSource)
                .input("leadType", sql.NVarChar, leadType)
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
                .query(leadQuery);
        }

        res.status(201).json({ message: "Lead created successfully!" });
    } catch (error) {
        console.error("Error creating lead:", error.message);
        res.status(500).json({ error: "Failed to create lead." });
    }
};

// Fetch Business Types
exports.getBusinessTypes = async (req, res) => {
  try {
    const db = await connectToDatabase(db3);
    const result = await db.query("SELECT BusinessTypeID, Type FROM BusinessType");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Lead Sources
exports.getLeadSources = async (req, res) => {
  try {
    const db = await connectToDatabase(db3);
    const result = await db.query("SELECT LeadSourceID, Source FROM LeadSource");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Lead Types
exports.getLeadTypes = async (req, res) => {
  try {
    const db = await connectToDatabase(db3);
    const result = await db.query("SELECT LeadTypeID, Type FROM LeadType");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Customer Types
exports.getCustomerTypes = async (req, res) => {
  try {
    const db = await connectToDatabase(db3);
    const result = await db.query("SELECT CustomerTypeID, Type FROM CustomerType");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Vehicle Models
exports.getVehicleModels = async (req, res) => {
  try {
    const db = await connectToDatabase(db3);
    const result = await db.query(
      "SELECT DISTINCT Brand, Variant, SubVariant, ModelYear FROM VehicleModel"
    );
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Company Info
exports.getCompanyInfo = async (req, res) => {
  try {
    const db = await connectToDatabase(db3);
    const result = await db.query("SELECT CompanyID, CompanyName, BusinessCategory FROM CompanyInfo");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Roles of Contact Details
exports.getRoles = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query("SELECT DISTINCT RoleName FROM ContactDetailsRoles");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching roles:", error.message);
        res.status(500).json({ error: "Failed to fetch roles." });
    }
};

// Fetch distinct brands
exports.getVehicleBrands = async (req, res) => {
    try {
        const pool = await connectToDatabase(db3);
        const result = await pool.request().query(
            "SELECT DISTINCT Brand FROM VehicleModel WHERE Status = 'Active'"
        );
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching vehicle brands:", error.message);
        res.status(500).json({ error: "Failed to fetch vehicle brands" });
    }
};

// Fetch distinct variants by brand
exports.getVariantsByBrand = async (req, res) => {
  const { brand } = req.query;
  try {
      const pool = await connectToDatabase(db3);
      const result = await pool.request()
          .input("brand", sql.NVarChar, brand)
          .query("SELECT DISTINCT Variant FROM VehicleModel WHERE Brand = @brand AND Status = 'Active'");
      res.json(result.recordset);
  } catch (error) {
      console.error("Error fetching variants:", error.message);
      res.status(500).json({ error: "Failed to fetch variants." });
  }
};

// Fetch distinct sub-variants by brand and variant
exports.getSubVariantsByBrandAndVariant = async (req, res) => {
  const { brand, variant } = req.query;
  try {
      const pool = await connectToDatabase(db3);
      const result = await pool.request()
          .input("brand", sql.NVarChar, brand)
          .input("variant", sql.NVarChar, variant)
          .query("SELECT DISTINCT SubVariant FROM VehicleModel WHERE Brand = @brand AND Variant = @variant AND Status = 'Active'");
      res.json(result.recordset);
  } catch (error) {
      console.error("Error fetching sub-variants:", error.message);
      res.status(500).json({ error: "Failed to fetch sub-variants." });
  }
};

// Fetch distinct model years by brand, variant, and sub-variant
exports.getModelYearsByBrandVariantAndSubVariant = async (req, res) => {
  const { brand, variant, subVariant } = req.query;
  try {
      const pool = await connectToDatabase(db3);
      const result = await pool.request()
          .input("brand", sql.NVarChar, brand)
          .input("variant", sql.NVarChar, variant)
          .input("subVariant", sql.NVarChar, subVariant)
          .query("SELECT DISTINCT ModelYear FROM VehicleModel WHERE Brand = @brand AND Variant = @variant AND SubVariant = @subVariant AND Status = 'Active'");
      res.json(result.recordset);
  } catch (error) {
      console.error("Error fetching model years:", error.message);
      res.status(500).json({ error: "Failed to fetch model years." });
  }
};