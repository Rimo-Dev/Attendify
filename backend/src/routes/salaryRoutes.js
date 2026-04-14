const express = require("express");
const controller = require("../controllers/salaryController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/me", authorize("employee"), controller.getMySalary);
router.get("/employee/:employeeId", authorize("admin", "hr", "manager"), controller.getEmployeeSalary);
router.get("/report", authorize("admin", "hr"), controller.getSalaryReport);

module.exports = router;
