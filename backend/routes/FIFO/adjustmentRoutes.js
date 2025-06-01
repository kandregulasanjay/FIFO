const express = require('express');
const router = express.Router();
const adjustmentController = require('../../controllers/FIFO/adjustment/adjustmentController');

router.post('/adjustment', adjustmentController.saveAdjustment);
router.get('/item_master', adjustmentController.getItemMasterData);
router.get('/bin_master', adjustmentController.getBinMasterData);

module.exports = router;
