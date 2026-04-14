const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

async function protect(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = req.cookies.token || bearerToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required."));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.userId).populate("employee");

    if (!user || !user.isActive) {
      return next(new ApiError(401, "User account is inactive or missing."));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token."));
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You are not allowed to perform this action."));
    }

    next();
  };
}

module.exports = {
  protect,
  authorize,
};
