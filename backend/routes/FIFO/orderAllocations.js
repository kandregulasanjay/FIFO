const express = require('express');
const { getAllOrderAllocations } = require('../../controllers/FIFO/orders/orderAllocationsController');
const router = express.Router();

router.get('/', (req, res) => {
    const { date } = req.query; 
    console.log(`Received date parameter in /orderAllocations route: ${date || 'null'}`); 
    getAllOrderAllocations(date, res);
});

module.exports = router;
