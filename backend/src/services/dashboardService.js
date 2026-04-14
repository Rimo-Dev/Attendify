const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const { getDayBounds, dayjs, getMonthBounds } = require("../utils/date");
const { buildSalarySummary } = require("./salaryService");

async function getAttendanceOverview() {
  const { start, end } = getDayBounds();
  const totalEmployees = await Employee.countDocuments({ isActive: true });
  const todaysAttendance = await Attendance.find({ date: { $gte: start, $lte: end } });
  const presentCount = todaysAttendance.filter((item) => ["present", "late", "half-day"].includes(item.status)).length;
  const lateCount = todaysAttendance.filter((item) => item.lateMinutes > 0).length;

  return {
    totalEmployees,
    presentCount,
    absentCount: Math.max(totalEmployees - presentCount, 0),
    lateCount,
  };
}

async function getMonthlyTrend() {
  const start = dayjs().subtract(5, "month").startOf("month");
  const result = [];

  for (let index = 0; index < 6; index += 1) {
    const month = start.add(index, "month");
    const { start: monthStart, end: monthEnd } = getMonthBounds(month.format("YYYY-MM"));
    const items = await Attendance.find({ date: { $gte: monthStart, $lte: monthEnd } });
    result.push({
      month: month.format("MMM YYYY"),
      present: items.filter((item) => ["present", "late", "half-day"].includes(item.status)).length,
      late: items.filter((item) => item.lateMinutes > 0).length,
    });
  }

  return result;
}

async function getAdminDashboard() {
  const overview = await getAttendanceOverview();
  const pendingLeaves = await LeaveRequest.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("employee");

  return {
    ...overview,
    pendingLeaves,
    monthlyTrend: await getMonthlyTrend(),
  };
}

async function getManagerDashboard() {
  const overview = await getAttendanceOverview();
  const pendingApprovals = await LeaveRequest.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("employee");

  return {
    ...overview,
    pendingApprovals,
    monthlyTrend: await getMonthlyTrend(),
  };
}

async function getEmployeeDashboard(employee) {
  return {
    today: await getAttendanceOverview(),
    salary: await buildSalarySummary(employee),
    recentLeaves: await LeaveRequest.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(5),
  };
}

module.exports = {
  getAdminDashboard,
  getManagerDashboard,
  getEmployeeDashboard,
};
