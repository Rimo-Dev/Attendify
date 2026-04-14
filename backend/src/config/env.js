const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieExpiresInDays: Number(process.env.COOKIE_EXPIRES_IN_DAYS || 7),
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || "System Admin",
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@attendify.com",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || "false") === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFromName: process.env.SMTP_FROM_NAME || "Attendify",
  smtpFromEmail: process.env.SMTP_FROM_EMAIL || "no-reply@attendify.com",
};
