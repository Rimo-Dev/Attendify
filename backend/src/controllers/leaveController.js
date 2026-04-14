const { body } = require("express-validator");
const LeaveRequest = require("../models/LeaveRequest");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const { dayjs } = require("../utils/date");

const leaveValidators = [
  body("leaveType").isIn(["casual", "sick", "annual", "unpaid"]),
  body("startDate").isISO8601(),
  body("endDate").isISO8601(),
  body("reason").notEmpty(),
];

const decisionValidators = [body("decisionNote").optional().isString()];

function getLeaveDays(startDate, endDate) {
  return dayjs(endDate).diff(dayjs(startDate), "day") + 1;
}

const applyLeave = asyncHandler(async (req, res) => {
  if (!req.user.employee) {
    throw new ApiError(400, "Employee profile is missing for this account.");
  }

  const days = getLeaveDays(req.body.startDate, req.body.endDate);
  if (days <= 0) {
    throw new ApiError(400, "Leave dates are invalid.");
  }

  const leave = await LeaveRequest.create({
    employee: req.user.employee._id,
    leaveType: req.body.leaveType,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    days,
    reason: req.body.reason,
  });

  return sendResponse(res, 201, "Leave request submitted successfully.", leave);
});

const getLeaves = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "employee") {
    filter.employee = req.user.employee._id;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const leaves = await LeaveRequest.find(filter).populate({
    path: "employee",
    populate: { path: "user" },
  }).sort({ createdAt: -1 });

  return sendResponse(res, 200, "Leave requests fetched successfully.", leaves);
});

const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    throw new ApiError(404, "Leave request not found.");
  }
  if (String(leave.employee) !== String(req.user.employee._id)) {
    throw new ApiError(403, "You can only cancel your own leave requests.");
  }
  if (leave.status !== "pending") {
    throw new ApiError(400, "Only pending leave requests can be cancelled.");
  }

  leave.status = "cancelled";
  await leave.save();
  return sendResponse(res, 200, "Leave request cancelled successfully.", leave);
});

async function handleDecision(req, res, status) {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    throw new ApiError(404, "Leave request not found.");
  }
  if (leave.status !== "pending") {
    throw new ApiError(400, "Only pending leave requests can be processed.");
  }

  leave.status = status;
  leave.decisionNote = req.body.decisionNote || "";
  leave.approver = req.user._id;
  leave.approverRole = req.user.role;
  await leave.save();

  if (status === "approved") {
    const employee = await Employee.findById(leave.employee);
    if (employee && employee.leaveBalance >= leave.days) {
      employee.leaveBalance -= leave.days;
      await employee.save();
    }
  }

  return sendResponse(res, 200, `Leave request ${status}.`, leave);
}

const approveLeave = asyncHandler(async (req, res) => handleDecision(req, res, "approved"));
const rejectLeave = asyncHandler(async (req, res) => handleDecision(req, res, "rejected"));

module.exports = {
  leaveValidators,
  decisionValidators,
  applyLeave,
  getLeaves,
  cancelLeave,
  approveLeave,
  rejectLeave,
};
