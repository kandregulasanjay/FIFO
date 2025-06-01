const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/REPORTS/reportsController');

router.get('/reports', reportController.getAllReports);
router.post('/report/:id', reportController.runReportQuery);
router.get('/report-menus', reportController.getReportMenus);
router.get('/filter-options', reportController.getFilterOptions);

module.exports = router;
