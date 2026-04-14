const express = require("express");
const controller = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/attendance", authorize("admin", "hr", "manager"), controller.attendanceReport);
router.get("/late-summary", authorize("admin", "hr", "manager"), controller.lateSummaryReport);
router.get("/leaves", authorize("admin", "hr", "manager"), controller.leaveReport);
router.get("/salary", authorize("admin", "hr"), controller.salaryReport);

module.exports = router;
