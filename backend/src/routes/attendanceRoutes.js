const express = require("express");
const controller = require("../controllers/attendanceController");
const validateRequest = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.post("/check-in", authorize("employee"), controller.checkIn);
router.post("/check-out", authorize("employee"), controller.checkOut);
router.get("/me", authorize("employee"), controller.attendanceQueryValidators, validateRequest, controller.getMyAttendance);
router
  .route("/")
  .get(authorize("admin", "hr", "manager"), controller.attendanceQueryValidators, validateRequest, controller.getAttendance)
  .post(authorize("admin", "hr", "manager"), controller.createManualAttendance);

router.patch("/:id", authorize("admin", "hr", "manager"), controller.attendanceUpdateValidators, validateRequest, controller.updateAttendance);

module.exports = router;
