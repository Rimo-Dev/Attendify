const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

router
  .route("/")
  .get(protect, getAnnouncements)
  .post(protect, authorizeRoles("Admin", "HR"), createAnnouncement);

router
  .route("/:id")
  .delete(protect, authorizeRoles("Admin", "HR"), deleteAnnouncement);

module.exports = router;
