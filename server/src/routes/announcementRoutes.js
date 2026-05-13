const express = require('express');
const router = express.Router();
const {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getAnnouncements)
    .post(protect, adminOnly, createAnnouncement);

router.route('/:id')
    .delete(protect, adminOnly, deleteAnnouncement);

module.exports = router;
