const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function createCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: env.cookieExpiresInDays * 24 * 60 * 60 * 1000,
  };
}

module.exports = {
  signToken,
  createCookieOptions,
};
