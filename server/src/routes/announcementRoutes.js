const express = require('express');
const router = express.Router();
const {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, adminOnly, hrOrAdmin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getAnnouncements)
    .post(protect, hrOrAdmin, createAnnouncement);

router.route('/:id')
    .put(protect, hrOrAdmin, updateAnnouncement)
    .delete(protect, hrOrAdmin, deleteAnnouncement);

module.exports = router;
