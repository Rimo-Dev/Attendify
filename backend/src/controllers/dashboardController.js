const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const { getAdminDashboard, getManagerDashboard, getEmployeeDashboard } = require("../services/dashboardService");

const adminDashboard = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "Admin dashboard fetched successfully.", await getAdminDashboard())
);

const hrDashboard = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "HR dashboard fetched successfully.", await getManagerDashboard())
);

const managerDashboard = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "Manager dashboard fetched successfully.", await getManagerDashboard())
);

const employeeDashboard = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "Employee dashboard fetched successfully.", await getEmployeeDashboard(req.user.employee))
);

module.exports = {
  adminDashboard,
  hrDashboard,
  managerDashboard,
  employeeDashboard,
};
