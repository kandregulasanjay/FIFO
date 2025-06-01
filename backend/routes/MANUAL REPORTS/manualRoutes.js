const express = require('express');
const { getManualReports, getItemCodes } = require('../../controllers/MANUAL REPORTS/manualControllers');

const router = express.Router();

router.get('/receiptsss', getManualReports);
router.get('/item-codesss', getItemCodes);

module.exports = router;