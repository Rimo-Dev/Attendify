const express = require('express');
const router = express.Router();
const { predictSalary } = require('../controllers/salaryController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/predict', protect, predictSalary);

module.exports = router;
