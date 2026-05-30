const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getMyAttendance,
    getAllAttendance,
    updateAttendance,
    deleteAttendance
} = require('../controllers/attendanceController');
const { protect, adminOnly, hrOrAdmin } = require('../middlewares/authMiddleware');

router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/my', protect, getMyAttendance);
router.get('/', protect, hrOrAdmin, getAllAttendance);

router.route('/:id')
    .put(protect, hrOrAdmin, updateAttendance)
    .delete(protect, hrOrAdmin, deleteAttendance);

module.exports = router;
