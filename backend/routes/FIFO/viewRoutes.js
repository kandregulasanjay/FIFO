const express = require('express');
const { getViewData } = require('../../controllers/FIFO/availability/viewController');

const router = express.Router();

router.get('/view', getViewData);

module.exports = router;
