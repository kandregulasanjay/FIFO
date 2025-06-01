const express = require('express');
const router = express.Router();
const holdingController = require('../../controllers/FIFO/holding/holdingController');
const HoldingTransferController = require('../../controllers/FIFO/holding/holdingTransferController');

router.get('/holding', holdingController.getHoldingData);
router.get('/holding/:invoice_number',holdingController.getHoldingDetails)
router.post('/holding/transfer', holdingController.saveHoldingTransfer);
router.get('/holding/pdf/:invoice_number', holdingController.getHoldingForPDF);
router.get('/holding/pdf/latest/:invoice_number', holdingController.getLatestHoldingForPDF);
router.get('/completed-holding', holdingController.getCompletedHoldingData);

router.get('/availability', HoldingTransferController.getAvailability);
router.post('/holdingtransfer', HoldingTransferController.saveTransfer);
router.get('/bin-master', HoldingTransferController.getBinMasterData);
router.get('/completed-holdingtransfers', HoldingTransferController.getCompletedTransfer);

module.exports = router;