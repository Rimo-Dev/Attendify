const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getEmployeePerformance,
} = require("../controllers/reportController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

router.get(
  "/dashboard",
  protect,
  authorizeRoles("Admin", "HR"),
  getDashboardStats,
);
router.get(
  "/employee/:id",
  protect,
  authorizeRoles("Admin", "HR"),
  getEmployeePerformance,
);

module.exports = router;
