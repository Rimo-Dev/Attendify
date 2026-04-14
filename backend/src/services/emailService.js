const nodemailer = require("nodemailer");
const env = require("../config/env");

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

async function sendLateArrivalEmail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    return { status: "skipped", errorMessage: "SMTP is not configured." };
  }

  await transporter.sendMail({
    from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
    to,
    subject,
    html,
  });

  return { status: "sent" };
}

module.exports = {
  sendLateArrivalEmail,
};
