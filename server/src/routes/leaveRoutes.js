const express = require('express');
const router = express.Router();
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus
} = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, applyLeave)
    .get(protect, adminOnly, getAllLeaves);

router.get('/my', protect, getMyLeaves);

router.route('/:id')
    .put(protect, adminOnly, updateLeaveStatus);

module.exports = router;
