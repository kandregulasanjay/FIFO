const express = require('express');
const router = express.Router();
const { updateOrderStatus } = require('../../controllers/FIFO/orders/orderStatusController');

// Route to update order status
router.post('/updateOrderStatus', updateOrderStatus);

module.exports = router;
