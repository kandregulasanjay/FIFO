const express = require('express');
const {  getPickslipExceptionData, getReceiptExceptionData, getHoldingReportData} = require('../../controllers/FIFO/exception/reportException');
const router = express.Router();

router.get('/receipt-exception', getReceiptExceptionData);
router.get('/pickslip-exception', getPickslipExceptionData);
router.get('/holding-report', getHoldingReportData);

module.exports = router;
