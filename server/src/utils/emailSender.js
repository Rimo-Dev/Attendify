const nodemailer = require("nodemailer");

let cachedTransporter = null;

const normalizeAppPassword = (value) => {
  if (value == null) return "";
  return String(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, "");
};

const normalizeEmail = (value) => {
  if (value == null) return "";
  return String(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
};

const gmailAuthHint =
  "Gmail rejected the login (535). Use a 16-character App Password from Google Account → Security → 2-Step Verification → App passwords (2FA must be on). For Workspace, an admin may need to allow SMTP.";

const resetTransporterCache = () => {
  cachedTransporter = null;
};

const isSmtpFullyConfigured = () =>
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!normalizeAppPassword(process.env.SMTP_USER) &&
  !!normalizeAppPassword(process.env.SMTP_PASS);

/** Gmail/Google Workspace SMTP: must send From the authenticated mailbox (unless you verified "Send mail as"). */
const isGoogleSmtpHost = () => {
  const h = String(process.env.SMTP_HOST || "").toLowerCase();
  return h.includes("gmail.com") || h.includes("googlemail.com");
};

const usesGmailStyleAuth = () => !isSmtpFullyConfigured() || isGoogleSmtpHost();

const getAuthMailbox = () => {
  if (isSmtpFullyConfigured()) return normalizeEmail(process.env.SMTP_USER);
  return normalizeEmail(process.env.EMAIL_USER);
};

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = isSmtpFullyConfigured()
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
        requireTLS: Number(process.env.SMTP_PORT) === 587,
        auth: {
          user: normalizeEmail(process.env.SMTP_USER),
          pass: normalizeAppPassword(process.env.SMTP_PASS),
        },
      })
    : nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: normalizeEmail(process.env.EMAIL_USER),
          pass: normalizeAppPassword(process.env.EMAIL_PASS),
        },
      });

  return cachedTransporter;
};

const sendEmail = async (options) => {
  const authMailbox = getAuthMailbox();
  const gmailPass = normalizeAppPassword(process.env.EMAIL_PASS);
  const smtpPass = normalizeAppPassword(process.env.SMTP_PASS);
  const emailPassConfigured = !!(gmailPass || smtpPass);
  if (!authMailbox || !emailPassConfigured) {
    const msg =
      "Email not configured: set EMAIL_USER + EMAIL_PASS (Google App Password), or SMTP_USER + SMTP_PASS";
    console.error(msg);
    return { ok: false, error: msg };
  }

  if (
    !isSmtpFullyConfigured() &&
    gmailPass.length > 0 &&
    gmailPass.length !== 16
  ) {
    console.warn(
      "[email] Gmail App Passwords are usually exactly 16 characters (spaces optional). Verify EMAIL_PASS in .env.",
    );
  }

  try {
    const transporter = getTransporter();
    const displayName = process.env.SMTP_FROM_NAME || "Attendance System";

    let from;
    let to = options.to || options.email;

    const fromOverride = normalizeAppPassword(process.env.SMTP_FROM_EMAIL);

    if (usesGmailStyleAuth()) {
      from = `${displayName} <${authMailbox}>`;
      if (
        fromOverride &&
        fromOverride.toLowerCase() !== authMailbox.toLowerCase()
      ) {
        console.warn(
          '[email] SMTP_FROM_EMAIL is ignored for Gmail: use Gmail "Send mail as" or SMTP_USER must match.',
        );
      }
      if (Array.isArray(options.bcc) && options.bcc.length > 0) {
        // Gmail rejects BCC-only; To must be valid for the authenticated account
        to = authMailbox;
      }
    } else {
      const fromAddr = fromOverride || authMailbox;
      from = options.from || `${displayName} <${fromAddr}>`;
      if (Array.isArray(options.bcc) && options.bcc.length > 0 && !to) {
        to = fromAddr;
      }
    }

    const mailOptions = {
      from,
      to,
      bcc: options.bcc,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    const sentTo =
      to ||
      options.email ||
      (Array.isArray(options.bcc)
        ? `${options.bcc.length} recipients (bcc)`
        : "unknown recipients");
    console.log(
      "Email sent:",
      sentTo,
      info.messageId ? `(id: ${info.messageId})` : "",
    );
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    const msg = error.message || String(error);
    if (/535|Invalid login|BadCredentials/i.test(msg)) {
      resetTransporterCache();
      console.error("[email]", gmailAuthHint);
      console.error(
        "[email] Account used:",
        normalizeEmail(process.env.EMAIL_USER) || "(missing EMAIL_USER)",
      );
    }
    const detail = error.response || error.responseCode || "";
    console.error("Error sending email:", msg, detail);
    return {
      ok: false,
      error: msg,
      hint: /535|Invalid login/i.test(msg) ? gmailAuthHint : undefined,
    };
  }
};

sendEmail.resetTransporterCache = resetTransporterCache;

module.exports = sendEmail;
