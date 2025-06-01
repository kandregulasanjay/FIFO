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

module.exports = {
  getFormNames,
  getSurveyFormNames,
  getSimpleFormMenuNames,
  getSurveyFormMenuNames,
};
