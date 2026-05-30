const express = require('express');
const router = express.Router();
const { getDashboardStats, getEmployeePerformance } = require('../controllers/reportController');
const { protect, adminOnly, hrOrAdmin } = require('../middlewares/authMiddleware');

router.get('/dashboard', protect, hrOrAdmin, getDashboardStats);
router.get('/employee/:id', protect, hrOrAdmin, getEmployeePerformance);

module.exports = router;
