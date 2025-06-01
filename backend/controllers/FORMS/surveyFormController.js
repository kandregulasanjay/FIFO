const sql = require('mssql');
const {db3,connectToDatabase} = require('../../db');

const getSurveyFormSpecifications = async (req, res) => {
  const { formTypeId, surveyFormName, phoneNumber } = req.query;
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request()
      .input('formTypeId', sql.Int, formTypeId)
      .input('surveyFormName', sql.NVarChar, surveyFormName)
      .input('phoneNumber', sql.NVarChar, phoneNumber) 
      .query(`
        SELECT * FROM SurveyFormSpecifications
        WHERE FormTypeId = @formTypeId AND SurveyFormName = @surveyFormName
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching survey form specifications');
  }
};

const submitSurveyFormData = async (req, res) => {
  const { surveyFormName, formData, phoneNumber } = req.body;

  try {
    // Validate surveyFormName
    if (!surveyFormName || typeof surveyFormName !== 'string') {
      return res.status(400).send('Invalid surveyFormName');
    }

    // Validate phoneNumber
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).send('Invalid phoneNumber');
    }

    // Validate formData
    if (!formData || typeof formData !== 'object' || Object.keys(formData).length === 0) {
      return res.status(400).send('Invalid formData');
    }

    const pool = await connectToDatabase(db3);

    // Create table if not exists
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${surveyFormName.replace(/'/g, "''")}' AND xtype='U')
      BEGIN
        CREATE TABLE [${surveyFormName.replace(/'/g, "''")}] (
          UniqueId INT IDENTITY(1,1),
          Timestamp DATETIME DEFAULT GETDATE(),
          SurveyFormName NVARCHAR(255),
          PhoneNumber NVARCHAR(255),
          ${Object.keys(formData).map(key => `[${key.replace(/'/g, "''")}] NVARCHAR(255)`).join(', ')}
        )
      END
    `;
    await pool.request().query(createTableQuery);

    // Dynamically construct columns and values for the SQL query
    const columns = ['SurveyFormName', 'PhoneNumber', ...Object.keys(formData)]
      .map((col) => `[${col.replace(/'/g, "''")}]`)
      .join(', ');

    const values = [surveyFormName, phoneNumber, ...Object.values(formData)]
      .map((val) => `'${String(val).replace(/'/g, "''")}'`)
      .join(', ');

    const insertQuery = `
      INSERT INTO [${surveyFormName.replace(/'/g, "''")}] (${columns})
      VALUES (${values})
    `;

    await pool.request().query(insertQuery);

    res.status(200).send('Survey form submitted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error submitting survey form data');
  }
};

module.exports = {
  getSurveyFormSpecifications,
  submitSurveyFormData,
};
