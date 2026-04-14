const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const { getOfficeSettings } = require("./officeSettingsService");
const { dayjs, getMonthBounds } = require("../utils/date");

function getWorkingDaysInMonth(settings, monthString) {
  const monthStart = dayjs(`${monthString}-01`).startOf("month");
  const monthEnd = monthStart.endOf("month");
  let cursor = monthStart;
  let count = 0;

  while (cursor.isBefore(monthEnd) || cursor.isSame(monthEnd, "day")) {
    if (settings.workdays.includes(cursor.day())) {
      count += 1;
    }
    cursor = cursor.add(1, "day");
  }

  return count;
}

async function buildSalarySummary(employee, monthString = dayjs().format("YYYY-MM")) {
  const settings = await getOfficeSettings();
  const { start, end } = getMonthBounds(monthString);

  const attendanceList = await Attendance.find({
    employee: employee._id,
    date: { $gte: start, $lte: end },
  });

  const approvedLeaves = await LeaveRequest.find({
    employee: employee._id,
    status: "approved",
    startDate: { $lte: end },
    endDate: { $gte: start },
  });

  const workingDays = getWorkingDaysInMonth(settings, monthString);
  const presentDays = attendanceList.filter((item) => ["present", "late", "half-day"].includes(item.status)).length;
  const approvedLeaveDays = approvedLeaves.reduce((sum, item) => sum + item.days, 0);
  const lateCount = attendanceList.filter((item) => item.lateMinutes > 0).length;
  const lateMinutes = attendanceList.reduce((sum, item) => sum + item.lateMinutes, 0);
  const absenceDays = Math.max(workingDays - presentDays - approvedLeaveDays, 0);
  const absenceDeduction = absenceDays * settings.absenceDeductionPerDay;
  const lateDeduction = lateMinutes * settings.latePenaltyPerMinute;
  const totalDeduction = absenceDeduction + lateDeduction;

  return {
    month: monthString,
    workingDays,
    presentDays,
    approvedLeaveDays,
    absenceDays,
    lateCount,
    lateMinutes,
    deductions: {
      absenceDeduction,
      lateDeduction,
      totalDeduction,
    },
    monthlySalary: employee.monthlySalary,
    predictedPayableSalary: Math.max(employee.monthlySalary - totalDeduction, 0),
  };
}

module.exports = {
  buildSalarySummary,
};
