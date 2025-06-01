const sql = require('mssql');
const {db3,connectToDatabase} = require('../../db');

const getFormNames = async (req, res) => {
  const { menu } = req.query; 
  try {
    const pool = await connectToDatabase(db3);
    const query = menu
      ? `SELECT DISTINCT FormName, Menu FROM SimpleFormSpecifications WHERE Menu = @menu`
      : `SELECT DISTINCT FormName, Menu FROM SimpleFormSpecifications`;
    const request = pool.request();
    if (menu) {
      request.input('menu', sql.VarChar, menu);
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching form names');
  }
};

const getSurveyFormNames = async (req, res) => {
  const { menu } = req.query;
  try {
    const pool = await connectToDatabase(db3);
    const query = menu
      ? `SELECT DISTINCT SurveyFormName, Menu FROM SurveyFormSpecifications WHERE Menu = @menu`
      : `SELECT DISTINCT SurveyFormName, Menu FROM SurveyFormSpecifications`;
    const request = pool.request();
    if (menu) {
      request.input('menu', sql.VarChar, menu);
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching survey form names');
  }
};

const getSimpleFormMenuNames = async (req, res) => {
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request().query('SELECT DISTINCT Menu FROM SimpleFormSpecifications');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send('Error fetching menu names');
  }
};

const getSurveyFormMenuNames = async (req, res) => {
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request().query('SELECT DISTINCT Menu FROM SurveyFormSpecifications');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send('Error fetching menu names');
  }
};

const getFormNamesByMenu = async (req, res) => {
  const { menu } = req.query;
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request()
      .input('menu', sql.VarChar, menu)
      .query('SELECT FormName FROM Forms WHERE Menu = @menu');
    res.json(result.recordset.map(row => row.FormName));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching form names');
  }
};

const getPhoneNumbersByFormName = async (req, res) => {
  const { formName } = req.query;
  try {
    const pool = await connectToDatabase(db3);
    const result = await pool.request()
      .input('formName', sql.VarChar, formName)
      .query(`SELECT PhoneNumber FROM [${formName.replace(/'/g, "''")}]`);
    res.json(result.recordset.map(row => row.PhoneNumber));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching phone numbers');
  }
};

const getUniqueIds = async (req, res) => {
  try {
    const pool = await connectToDatabase(db3);
    const formNamesResult = await pool.request().query('SELECT DISTINCT FormName FROM SimpleFormSpecifications');
    const formNames = formNamesResult.recordset.map(row => row.FormName);

    let uniqueIds = [];
    for (const formName of formNames) {
      const result = await pool.request().query(`SELECT DISTINCT UniqueId FROM [${formName.replace(/'/g, "''")}]`);
      uniqueIds = uniqueIds.concat(result.recordset.map(row => row.UniqueId));
    }

    res.json(uniqueIds);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching unique IDs');
  }
};

module.exports = {
  getFormNames,
  getSurveyFormNames,
  getSimpleFormMenuNames,
  getSurveyFormMenuNames,
  getFormNamesByMenu,
  getPhoneNumbersByFormName,
  getUniqueIds
};
