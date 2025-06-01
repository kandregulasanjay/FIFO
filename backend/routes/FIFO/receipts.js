const express = require('express');
const { getAllReceipts, getReceiptDetails, saveAllocation, getReceiptForPDF, updateReceiptDetails } = require('../../controllers/FIFO/receipts/receiptsController');
const router = express.Router();

router.get('/receipts', (req, res) => {
    const { date } = req.query; 
    console.log(`Received date parameter in route: ${date}`); 
    getAllReceipts(date, res); 
});
router.get('/receipts/:receipt_number', getReceiptDetails);

router.post('/receipts/update', updateReceiptDetails);

router.post('/receipts/allocation', saveAllocation);

router.get('/getReceiptForPDF/:receipt_number', getReceiptForPDF);

router.get('/receipt-allocations', (req, res) => {
    const { date } = req.query; 
    console.log(`Received date parameter in /receipt-allocations route: ${date}`);
});

module.exports = router;
