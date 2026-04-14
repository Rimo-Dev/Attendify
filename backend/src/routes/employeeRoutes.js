const express = require("express");
const controller = require("../controllers/employeeController");
const validateRequest = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(authorize("admin", "hr", "manager"), controller.employeeQueryValidators, validateRequest, controller.getEmployees)
  .post(authorize("admin", "hr"), controller.employeeValidators, validateRequest, controller.createEmployee);

router
  .route("/:id")
  .get(authorize("admin", "hr", "manager"), controller.getEmployeeById)
  .patch(authorize("admin", "hr"), controller.employeeUpdateValidators, validateRequest, controller.updateEmployee)
  .delete(authorize("admin"), controller.deleteEmployee);

router.patch("/:id/status", authorize("admin", "hr"), controller.updateEmployeeStatus);

module.exports = router;
