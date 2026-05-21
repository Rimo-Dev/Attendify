const express = require("express");
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getOnLeave,
  updateLeaveStatus,
  editLeave,
  deleteLeave,
} = require("../controllers/leaveController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

router
  .route("/")
  .post(protect, applyLeave)
  .get(protect, authorizeRoles("Admin", "HR"), getAllLeaves);

router.get("/my", protect, getMyLeaves);

router.get("/onleave", protect, authorizeRoles("Admin", "HR"), getOnLeave);

router
  .route("/:id")
  .put(protect, authorizeRoles("Admin", "HR"), updateLeaveStatus)
  .patch(protect, authorizeRoles("Admin", "HR"), editLeave)
  .delete(protect, authorizeRoles("Admin", "HR"), deleteLeave);

module.exports = router;
