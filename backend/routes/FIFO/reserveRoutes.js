const express = require('express');
const router = express.Router();
const reserveController = require('../../controllers/FIFO/reserve/reserveController');

router.get('/reserve', reserveController.getReserveData);

router.post('/reserve/transfer', reserveController.transferReserve);

router.get('/reserve-release', reserveController.getReserveReleaseData);

module.exports = router;
