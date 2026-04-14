const express = require("express");
const controller = require("../controllers/leaveController");
const validateRequest = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(controller.getLeaves)
  .post(authorize("employee"), controller.leaveValidators, validateRequest, controller.applyLeave);

router.patch("/:id/cancel", authorize("employee"), controller.cancelLeave);
router.patch("/:id/approve", authorize("hr", "manager"), controller.decisionValidators, validateRequest, controller.approveLeave);
router.patch("/:id/reject", authorize("hr", "manager"), controller.decisionValidators, validateRequest, controller.rejectLeave);

module.exports = router;
