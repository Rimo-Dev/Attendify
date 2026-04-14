const { stringify } = require("csv-stringify/sync");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const { getMonthBounds } = require("../utils/date");
const { buildSalarySummary } = require("../services/salaryService");

function sendCsv(res, filename, records) {
  const csv = stringify(records, { header: true });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  return res.status(200).send(csv);
}

const attendanceReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.month) {
    const { start, end } = getMonthBounds(req.query.month);
    filter.date = { $gte: start, $lte: end };
  }

  const items = await Attendance.find(filter).populate({ path: "employee", populate: { path: "user" } });
  const records = items.map((item) => ({
    employeeId: item.employee?.employeeId || "",
    employeeName: item.employee?.user?.name || "",
    date: item.dateKey,
    status: item.status,
    lateMinutes: item.lateMinutes,
    earlyExitMinutes: item.earlyExitMinutes,
    workedMinutes: item.workedMinutes,
  }));

  if (req.query.download === "csv") {
    return sendCsv(res, "attendance-report.csv", records);
  }
  return sendResponse(res, 200, "Attendance report fetched successfully.", records);
});

const leaveReport = asyncHandler(async (req, res) => {
  const items = await LeaveRequest.find().populate({ path: "employee", populate: { path: "user" } });
  const records = items.map((item) => ({
    employeeId: item.employee?.employeeId || "",
    employeeName: item.employee?.user?.name || "",
    leaveType: item.leaveType,
    startDate: item.startDate.toISOString().slice(0, 10),
    endDate: item.endDate.toISOString().slice(0, 10),
    days: item.days,
    status: item.status,
  }));

  if (req.query.download === "csv") {
    return sendCsv(res, "leave-report.csv", records);
  }
  return sendResponse(res, 200, "Leave report fetched successfully.", records);
});

const lateSummaryReport = asyncHandler(async (req, res) => {
  const items = await Attendance.find({ lateMinutes: { $gt: 0 } }).populate({ path: "employee", populate: { path: "user" } });
  const records = items.map((item) => ({
    employeeId: item.employee?.employeeId || "",
    employeeName: item.employee?.user?.name || "",
    date: item.dateKey,
    lateMinutes: item.lateMinutes,
  }));

  if (req.query.download === "csv") {
    return sendCsv(res, "late-summary-report.csv", records);
  }
  return sendResponse(res, 200, "Late summary report fetched successfully.", records);
});

const salaryReport = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ isActive: true }).populate("user");
  const records = await Promise.all(
    employees.map(async (employee) => {
      const salary = await buildSalarySummary(employee, req.query.month);
      return {
        employeeId: employee.employeeId,
        employeeName: employee.user?.name || "",
        month: salary.month,
        monthlySalary: salary.monthlySalary,
        absenceDays: salary.absenceDays,
        lateMinutes: salary.lateMinutes,
        totalDeduction: salary.deductions.totalDeduction,
        predictedPayableSalary: salary.predictedPayableSalary,
      };
    })
  );

  if (req.query.download === "csv") {
    return sendCsv(res, "salary-report.csv", records);
  }
  return sendResponse(res, 200, "Salary report fetched successfully.", records);
});

module.exports = {
  attendanceReport,
  leaveReport,
  lateSummaryReport,
  salaryReport,
};
