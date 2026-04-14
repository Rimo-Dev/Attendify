const { body } = require("express-validator");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const { signToken, createCookieOptions } = require("../utils/tokens");

const loginValidators = [body("email").isEmail(), body("password").isLength({ min: 6 })];
const changePasswordValidators = [
  body("currentPassword").isLength({ min: 6 }),
  body("newPassword").isLength({ min: 6 }),
];

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    employee: user.employee,
  };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password").populate("employee");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }
  if (!user.isActive) {
    throw new ApiError(403, "Your account is deactivated.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);
  res.cookie("token", token, createCookieOptions());

  return sendResponse(res, 200, "Login successful.", {
    token,
    user: sanitizeUser(user),
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return sendResponse(res, 200, "Logout successful.");
});

const getMe = asyncHandler(async (req, res) => sendResponse(res, 200, "Profile fetched.", sanitizeUser(req.user)));

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(400, "Current password is incorrect.");
  }

  user.password = req.body.newPassword;
  await user.save();

  return sendResponse(res, 200, "Password updated successfully.");
});

module.exports = {
  loginValidators,
  changePasswordValidators,
  login,
  logout,
  getMe,
  changePassword,
};
