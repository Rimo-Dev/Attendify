const express = require("express");
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  deleteLeave,
  updateLeave,
} = require("../controllers/leaveController");
const {
  protect,
  adminOnly,
  hrOrAdmin,
} = require("../middlewares/authMiddleware");

router
  .route("/")
  .post(protect, applyLeave)
  .get(protect, hrOrAdmin, getAllLeaves);

router.get("/my", protect, getMyLeaves);

router
  .route("/:id")
  .put(protect, updateLeaveStatus)
  .delete(protect, deleteLeave);

router.put("/edit/:id", protect, updateLeave);

module.exports = router;
