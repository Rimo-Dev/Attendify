const express = require("express");
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");
const {
  protect,
  adminOnly,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

router
  .route("/")
  .get(protect, authorizeRoles("Admin", "HR"), getEmployees)
  .post(protect, authorizeRoles("Admin", "HR"), createEmployee);

router
  .route("/:id")
  .get(protect, authorizeRoles("Admin", "HR"), getEmployeeById)
  .put(protect, authorizeRoles("Admin", "HR"), updateEmployee)
  .delete(protect, authorizeRoles("Admin", "HR"), deleteEmployee);

module.exports = router;
