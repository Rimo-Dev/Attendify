const express = require("express");
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} = require("../controllers/attendanceController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

router.post("/check-in", protect, checkIn);
router.put("/check-out", protect, checkOut);
router.get("/my", protect, getMyAttendance);
router.get("/", protect, authorizeRoles("Admin", "HR"), getAllAttendance);

module.exports = router;
