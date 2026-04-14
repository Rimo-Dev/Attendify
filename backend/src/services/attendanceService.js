const NotificationLog = require("../models/NotificationLog");
const { getOfficeSettings } = require("./officeSettingsService");
const { sendLateArrivalEmail } = require("./emailService");
const { combineDateAndTime, getDateKey, minutesBetween } = require("../utils/date");

function getLateMinutes(checkInAt, settings) {
  const officeStart = combineDateAndTime(checkInAt, settings.startTime);
  const graceEnd = new Date(officeStart.getTime() + settings.gracePeriodMinutes * 60000);
  if (checkInAt <= graceEnd) {
    return 0;
  }
  return minutesBetween(graceEnd, checkInAt);
}

function getEarlyExitMinutes(checkOutAt, settings) {
  const officeEnd = combineDateAndTime(checkOutAt, settings.endTime);
  if (checkOutAt >= officeEnd) {
    return 0;
  }
  return minutesBetween(checkOutAt, officeEnd);
}

async function sendLateNotification({ employee, user, checkInAt, lateMinutes, settings }) {
  const subject = "Attendify late check-in alert";
  const html = `
    <div>
      <h2>Late check-in detected</h2>
      <p>Dear ${user.name},</p>
      <p>Your check-in time was ${new Date(checkInAt).toLocaleTimeString()}.</p>
      <p>Office start time is ${settings.startTime} with a ${settings.gracePeriodMinutes}-minute grace period.</p>
      <p>Late duration: ${lateMinutes} minutes.</p>
    </div>
  `;

  try {
    const result = await sendLateArrivalEmail({ to: user.email, subject, html });
    await NotificationLog.create({
      employee: employee._id,
      category: "late-arrival",
      status: result.status,
      recipient: user.email,
      payload: {
        checkInAt,
        officeStartTime: settings.startTime,
        lateMinutes,
      },
      errorMessage: result.errorMessage || "",
    });
  } catch (error) {
    await NotificationLog.create({
      employee: employee._id,
      category: "late-arrival",
      status: "failed",
      recipient: user.email,
      payload: {
        checkInAt,
        officeStartTime: settings.startTime,
        lateMinutes,
      },
      errorMessage: error.message,
    });
  }
}

async function buildCheckInPayload(employee, user) {
  const now = new Date();
  const settings = await getOfficeSettings();
  const lateMinutes = getLateMinutes(now, settings);

  if (lateMinutes > 0) {
    await sendLateNotification({ employee, user, checkInAt: now, lateMinutes, settings });
  }

  return {
    employee: employee._id,
    date: now,
    dateKey: getDateKey(now),
    checkInAt: now,
    source: "self",
    lateMinutes,
    status: lateMinutes > 0 ? "late" : "present",
  };
}

function buildCheckOutPayload(attendance, settings) {
  const now = new Date();
  const workedMinutes = attendance.checkInAt ? minutesBetween(attendance.checkInAt, now) : 0;
  return {
    checkOutAt: now,
    earlyExitMinutes: getEarlyExitMinutes(now, settings),
    workedMinutes,
    status:
      workedMinutes <= settings.halfDayThresholdMinutes && attendance.status !== "late"
        ? "half-day"
        : attendance.status,
  };
}

module.exports = {
  getLateMinutes,
  getEarlyExitMinutes,
  buildCheckInPayload,
  buildCheckOutPayload,
};
