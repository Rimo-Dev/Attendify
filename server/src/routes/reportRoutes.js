const express = require('express');
const router = express.Router();
const { getDashboardStats, getEmployeePerformance } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/employee/:id', protect, adminOnly, getEmployeePerformance);

module.exports = router;
