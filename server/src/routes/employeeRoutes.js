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
  hrOrAdmin,
} = require("../middlewares/authMiddleware");

router
  .route("/")
  .get(protect, getEmployees)
  .post(protect, adminOnly, createEmployee);

router
  .route("/:id")
  .get(protect, hrOrAdmin, getEmployeeById)
  .put(protect, adminOnly, updateEmployee)
  .delete(protect, adminOnly, deleteEmployee);

module.exports = router;
