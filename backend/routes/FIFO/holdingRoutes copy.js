const express = require('express');
const router = express.Router();
const holdingController = require('../../controllers/FIFO/holding/holdingController');

router.get('/holding', holdingController.getHoldingData);
router.post('/holding/transfer', holdingController.saveHoldingTransfer);
router.get('/pickslip/:pickslip_number', holdingController.getHoldingForPDF);
router.get('/pickslip/latest/:pickslip_number', holdingController.getLatestHoldingForPDF);
router.get('/holding/completed', holdingController.getCompletedHoldingData);

module.exports = router;


