const express = require("express");
const authRoutes = require("./authRoutes");
const employeeRoutes = require("./employeeRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const leaveRoutes = require("./leaveRoutes");
const salaryRoutes = require("./salaryRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const reportRoutes = require("./reportRoutes");
const settingsRoutes = require("./settingsRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leaves", leaveRoutes);
router.use("/salary", salaryRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
