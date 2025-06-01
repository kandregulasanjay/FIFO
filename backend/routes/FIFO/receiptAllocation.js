const express = require('express');
const { getReceiptAllocations } = require('../../controllers/FIFO/receipts/receiptAllocationController');
const router = express.Router();

// Get all order allocations
router.get('/', (req, res) => {
    const { date } = req.query;
    getReceiptAllocations(date, res); 
});

module.exports = router;
