const express = require("express");
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const {
  protect,
  adminOnly,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

router
  .route("/")
  .get(protect, authorizeRoles("Admin", "HR"), getDepartments)
  .post(protect, adminOnly, createDepartment);

router
  .route("/:id")
  .put(protect, adminOnly, updateDepartment)
  .delete(protect, adminOnly, deleteDepartment);

module.exports = router;
