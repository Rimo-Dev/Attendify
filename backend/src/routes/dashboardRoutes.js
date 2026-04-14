const express = require("express");
const controller = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/admin", authorize("admin"), controller.adminDashboard);
router.get("/hr", authorize("hr"), controller.hrDashboard);
router.get("/manager", authorize("manager"), controller.managerDashboard);
router.get("/employee", authorize("employee"), controller.employeeDashboard);

module.exports = router;
