const express = require('express');
const { getAllPendingOrders, getOrderDetailsByOrderNumber, completeOrder, getPickslipForPDF , getPickslipReportData} = require('../../controllers/FIFO/orders/ordersController');
const router = express.Router();

router.get('/getPickslipReportData', getPickslipReportData);

router.get('/pendingOrders', (req, res) => {
    const { date } = req.query; 
    getAllPendingOrders(date, res); 
});

router.get('/:pickslipNumber', getOrderDetailsByOrderNumber);

router.post('/complete', completeOrder);

router.get('/getPickslipForPDF/:pickslipNumber', getPickslipForPDF);

module.exports = router;
