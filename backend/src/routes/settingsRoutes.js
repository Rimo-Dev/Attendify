const express = require("express");
const controller = require("../controllers/settingsController");
const validateRequest = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router
  .route("/office")
  .get(authorize("admin", "hr", "manager"), controller.getOfficeSettingsController)
  .patch(authorize("admin"), controller.officeSettingsValidators, validateRequest, controller.updateOfficeSettings);

module.exports = router;
