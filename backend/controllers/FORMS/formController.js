const sql = require('mssql');
const {db3,connectToDatabase} = require('../../db');
const fs = require('fs');
const path = require('path');

const getFormSpecifications = async (req, res) => {
  const { formTypeId, formName } = req.query;
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request()
      .input('formTypeId', sql.Int, formTypeId)
      .input('formName', sql.VarChar, formName)
      .query(`
        SELECT DISTINCT 
          FormTypeID, FormName, FieldName, InputType, DropdownData, 
          FieldsMandatory, Placeholder, Label, LabelMandatory, 
          SubmitText, Menu, AllowTextEntry, 
          COALESCE(GroupHeading, '') as GroupHeading,
          GroupCollapse
        FROM SimpleFormSpecifications
        WHERE FormTypeID = @formTypeId AND FormName = @formName
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching form specifications');
  }
};

const getDropdownOptions = async (req, res) => {
  const { fieldName } = req.query;
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request()
      .input('fieldName', sql.VarChar, fieldName)
      .query(`
        SELECT DropdownData FROM SimpleFormSpecifications
        WHERE FieldName = @fieldName AND DropdownData IS NOT NULL
      `);
    if (result.recordset.length > 0 && result.recordset[0].DropdownData) {
      const dropdownQuery = result.recordset[0].DropdownData;
      const dropdownResult = await pool.request().query(dropdownQuery);
      res.json(dropdownResult.recordset.map(row => Object.values(row)[0]));
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching dropdown options');
  }
};

const getFormDetails = async (req, res) => {
  const { formName } = req.query;
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request()
      .input('formName', sql.VarChar, formName)
      .query('SELECT * FROM FormDetails WHERE FormName = @formName');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching form details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getFormData = async (req, res) => {
  const { formName, uniqueId } = req.query;

  // Validate formName and uniqueId
  if (!formName) {
    return res.status(400).send('Error: formName is required');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(formName)) {
    return res.status(400).send('Error: Invalid formName');
  }
  if (!uniqueId || isNaN(uniqueId) || uniqueId < -2147483648 || uniqueId > 2147483647) {
    return res.status(400).send('Error: uniqueId must be a valid integer between -2147483648 and 2147483647');
  }

  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request()
      .input('uniqueId', sql.Int, uniqueId) // Pass uniqueId as a parameter
      .query(`SELECT * FROM [${formName}] WHERE UniqueId = @uniqueId`); // Use parameterized query

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).send('Form data not found');
    }
  } catch (err) {
    console.error('Error fetching form data:', err);
    res.status(500).send('Error fetching form data');
  }
};

const submitFormData = async (req, res) => {
  const { formName, formData } = req.body; // Ensure formData is correctly destructured
  try {
    const pool = await connectToDatabase(db3);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    // Create table if not exists
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${formName.replace(/'/g, "''")}' AND xtype='U')
      BEGIN
        CREATE TABLE [${formName.replace(/'/g, "''")}] (
          UniqueId INT IDENTITY(1,1),
          Timestamp DATETIME DEFAULT GETDATE(),
          ${Object.keys(formData).map(key => `[${key.replace(/'/g, "''")}] VARCHAR(255)`).join(', ')}
        )
      END
    `;
    await request.query(createTableQuery);

    // Handle file attachments and update formData with file paths
    if (req.files) {
      const files = req.files;

      for (const key in files) {
        const file = files[key];
        const filePath = path.join(__dirname, '../uploads', `${Date.now()}_${file.name}`);
        await file.mv(filePath);
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${Date.now()}_${file.name}`;
        formData[key] = fileUrl;
      }
    }

    // Insert form data into the table
    const columns = Object.keys(formData).map(key => `[${key.replace(/'/g, "''")}]`).join(', ');
    const values = Object.values(formData).map(value => `'${String(value).replace(/'/g, "''")}'`).join(', ');
    const insertQuery = `
      INSERT INTO [${formName.replace(/'/g, "''")}] (${columns})
      VALUES (${values})
    `;
    await request.query(insertQuery);

    await transaction.commit();
    res.status(200).send('Form submitted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error submitting form data');
  }
};

const updateFormData = async (req, res) => {
  const { formName, uniqueId, formData } = req.body;

  if (!formData || Object.keys(formData).length === 0) {
    return res.status(400).send('Error: formData is required');
  }

  try {
    const pool = await connectToDatabase(db3);
    const request = pool.request();

    // Add the uniqueId parameter first
    request.input('UniqueId', sql.Int, uniqueId);

    // Fetch existing columns in the table
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${formName.replace(/'/g, "''")}'
    `);
    const existingColumns = columnsResult.recordset.map(row => row.COLUMN_NAME);

    // Add other parameters to the request
    const declaredParams = new Set(['UniqueId']);
    Object.keys(formData).forEach((key) => {
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_ ()]/g, '');
      if (existingColumns.includes(sanitizedKey) && !declaredParams.has(sanitizedKey)) {
        request.input(sanitizedKey.replace(/ /g, '_').replace(/[()]/g, ''), sql.NVarChar, formData[key] ? formData[key].toString() : '');
        declaredParams.add(sanitizedKey);
      }
    });

    // Construct the update query
    let query = `UPDATE [${formName.replace(/'/g, "''")}] SET `;
    query += Object.keys(formData)
  .filter(key => key !== 'UniqueId' && existingColumns.includes(key.replace(/[^a-zA-Z0-9_ ()]/g, '')))
  .map((key) => `[${key.replace(/[^a-zA-Z0-9_ ()]/g, '')}] = @${key.replace(/ /g, '_').replace(/[()]/g, '').replace(/[^a-zA-Z0-9_]/g, '')}`)
  .join(', ');
    query += ` WHERE UniqueId = @UniqueId`;

    // Execute the query
    await request.query(query);

    res.status(200).send('Form updated successfully');
  } catch (error) {
    console.error('Error updating form data:', error);
    res.status(500).send('Error updating form data');
  }
};

const searchFormData = async (req, res) => {
  const { formName, searchValue } = req.query;
  try {
    const pool = await connectToDatabase(db3);

    // Fetch search fields for the given formName
    const searchFieldsResult = await pool.request()
      .input('formName', sql.VarChar, formName)
      .query(`
        SELECT searchField1, searchField2, searchField3, searchField4 
        FROM UpdateDynamicForm 
        WHERE FormName = @formName
      `);
    
    if (searchFieldsResult.recordset.length === 0) {
      return res.status(404).send('Form not found in UpdateDynamicForm');
    }

    const { searchField1, searchField2, searchField3, searchField4 } = searchFieldsResult.recordset[0];

    // Construct the search query
    const searchQuery = `
      SELECT TOP 1 * FROM [${formName.replace(/'/g, "''")}] 
      WHERE [${searchField1}] = @searchValue 
      OR [${searchField2}] = @searchValue 
      OR [${searchField3}] = @searchValue 
      OR [${searchField4}] = @searchValue
    `;

    const result = await pool.request()
      .input('searchValue', sql.VarChar, searchValue)
      .query(searchQuery);

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).send('No matching record found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error searching form data');
  }
};

const getSimpleFormUniqueIds = async (req, res) => {
  try {
    const pool = await connectToDatabase(db3);
    const formNamesResult = await pool.request().query(`
      SELECT DISTINCT FormName FROM SimpleFormSpecifications
    `);
    const formNames = formNamesResult.recordset.map(row => row.FormName);

    let uniqueIds = [];
    for (const formName of formNames) {
      const tableExistsResult = await pool.request().query(`
        IF OBJECT_ID('${formName.replace(/'/g, "''")}', 'U') IS NOT NULL
        BEGIN
          SELECT 1 AS TableExists
        END
        ELSE
        BEGIN
          SELECT 0 AS TableExists
        END
      `);

      if (tableExistsResult.recordset[0].TableExists) {
        const result = await pool.request().query(`
          SELECT DISTINCT UniqueId, '${formName.replace(/'/g, "''")}' AS FormName FROM [${formName.replace(/'/g, "''")}]
        `);
        uniqueIds = uniqueIds.concat(result.recordset);
      }
    }

    res.json(uniqueIds);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching unique IDs');
  }
};

module.exports = {
  getFormSpecifications,
  getDropdownOptions,
  submitFormData,
  updateFormData,
  getFormDetails,
  getFormData,
  searchFormData,
};
