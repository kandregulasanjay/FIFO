const express = require('express');
const { getAllLeads, updateLeadDetails, getDropdownData } = require('../../controllers/FLEET/PendingLeadsController');
const router = express.Router();

router.get('/leads', (req, res) => {
    const { date } = req.query; 
    console.log(`Received date parameter in route: ${date}`); 
    getAllLeads(date, res); 
});

router.post('/leads/update', updateLeadDetails);


router.get('/dropdown-data', getDropdownData);

module.exports = router;