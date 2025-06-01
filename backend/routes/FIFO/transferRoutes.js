const express = require('express');
const router = express.Router();
const transferController = require('../../controllers/FIFO/transfer/transferController');

router.get('/availability', transferController.getAvailability);
router.post('/transfer', transferController.saveTransfer);
router.get('/bin-master', transferController.getBinMasterData);
router.get('/completed-transfers', transferController.getCompletedTransfer);

module.exports = router;
