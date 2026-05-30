const express = require("express");
const router = express.Router();
const { loginUser, getUserProfile } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

module.exports = router;
