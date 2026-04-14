const express = require("express");
const controller = require("../controllers/authController");
const validateRequest = require("../middleware/validate");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/login", controller.loginValidators, validateRequest, controller.login);
router.post("/logout", controller.logout);
router.get("/me", protect, controller.getMe);
router.patch("/change-password", protect, controller.changePasswordValidators, validateRequest, controller.changePassword);

module.exports = router;
