const { body, query } = require("express-validator");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const { getDateKey, getDayBounds, getMonthBounds, getWeekRange } = require("../utils/date");
const { buildCheckInPayload, buildCheckOutPayload } = require("../services/attendanceService");
const { getOfficeSettings } = require("../services/officeSettingsService");

const attendanceQueryValidators = [
  query("employeeId").optional().isMongoId(),
  query("range").optional().isIn(["day", "week", "month"]),
];

const attendanceUpdateValidators = [body("status").optional().isIn(["present", "late", "absent", "leave", "half-day"])];

const checkIn = asyncHandler(async (req, res) => {
  if (!req.user.employee) {
    throw new ApiError(400, "Employee profile is missing for this account.");
  }

  const dateKey = getDateKey(new Date());
  const existing = await Attendance.findOne({ employee: req.user.employee._id, dateKey });
  if (existing) {
    throw new ApiError(409, "Attendance has already been marked for today.");
  }

  const attendance = await Attendance.create(await buildCheckInPayload(req.user.employee, req.user));
  return sendResponse(res, 201, "Check-in successful.", attendance);
});

const checkOut = asyncHandler(async (req, res) => {
  if (!req.user.employee) {
    throw new ApiError(400, "Employee profile is missing for this account.");
  }

  const attendance = await Attendance.findOne({
    employee: req.user.employee._id,
    dateKey: getDateKey(new Date()),
  });

  if (!attendance) {
    throw new ApiError(400, "You must check in before checking out.");
  }
  if (attendance.checkOutAt) {
    throw new ApiError(409, "You have already checked out today.");
  }

  const settings = await getOfficeSettings();
  Object.assign(attendance, buildCheckOutPayload(attendance, settings));
  await attendance.save();

  return sendResponse(res, 200, "Check-out successful.", attendance);
});

const getMyAttendance = asyncHandler(async (req, res) => {
  if (!req.user.employee) {
    throw new ApiError(400, "Employee profile is missing for this account.");
  }

  const range = req.query.range || "month";
  let bounds = getMonthBounds();
  if (range === "day") {
    bounds = getDayBounds();
  } else if (range === "week") {
    bounds = getWeekRange();
  }

  const items = await Attendance.find({
    employee: req.user.employee._id,
    date: { $gte: bounds.start, $lte: bounds.end },
  }).sort({ date: -1 });

  return sendResponse(res, 200, "Attendance fetched successfully.", items);
});

const getAttendance = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.employeeId) {
    filter.employee = req.query.employeeId;
  }
  if (req.query.month) {
    const { start, end } = getMonthBounds(req.query.month);
    filter.date = { $gte: start, $lte: end };
  }

  const items = await Attendance.find(filter).populate({
    path: "employee",
    populate: { path: "user" },
  }).sort({ date: -1 });

  return sendResponse(res, 200, "Attendance fetched successfully.", items);
});

const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    throw new ApiError(404, "Attendance record not found.");
  }

  ["status", "checkInAt", "checkOutAt", "remarks", "lateMinutes", "earlyExitMinutes", "workedMinutes"].forEach((field) => {
    if (req.body[field] !== undefined) {
      attendance[field] = req.body[field];
    }
  });
  attendance.audit = { updatedBy: req.user._id, updatedAt: new Date() };
  await attendance.save();

  return sendResponse(res, 200, "Attendance updated successfully.", attendance);
});

const createManualAttendance = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.body.employeeId);
  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  const dateKey = getDateKey(req.body.date || new Date());
  const existing = await Attendance.findOne({ employee: employee._id, dateKey });
  if (existing) {
    throw new ApiError(409, "Attendance record already exists for this date.");
  }

  const attendance = await Attendance.create({
    employee: employee._id,
    date: req.body.date || new Date(),
    dateKey,
    checkInAt: req.body.checkInAt || null,
    checkOutAt: req.body.checkOutAt || null,
    status: req.body.status || "present",
    lateMinutes: req.body.lateMinutes || 0,
    earlyExitMinutes: req.body.earlyExitMinutes || 0,
    workedMinutes: req.body.workedMinutes || 0,
    source: "manual",
    remarks: req.body.remarks || "",
    audit: { updatedBy: req.user._id, updatedAt: new Date() },
  });

  return sendResponse(res, 201, "Attendance created successfully.", attendance);
});

module.exports = {
  attendanceQueryValidators,
  attendanceUpdateValidators,
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendance,
  updateAttendance,
  createManualAttendance,
};
