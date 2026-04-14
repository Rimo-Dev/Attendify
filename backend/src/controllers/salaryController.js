const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/response");
const { buildSalarySummary } = require("../services/salaryService");

const getMySalary = asyncHandler(async (req, res) => {
  if (!req.user.employee) {
    throw new ApiError(400, "Employee profile is missing for this account.");
  }

  return sendResponse(
    res,
    200,
    "Salary summary fetched successfully.",
    await buildSalarySummary(req.user.employee, req.query.month)
  );
});

const getEmployeeSalary = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.employeeId);
  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  return sendResponse(
    res,
    200,
    "Employee salary summary fetched successfully.",
    await buildSalarySummary(employee, req.query.month)
  );
});

const getSalaryReport = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ isActive: true });
  const report = await Promise.all(
    employees.map(async (employee) => ({
      employee,
      salary: await buildSalarySummary(employee, req.query.month),
    }))
  );

  return sendResponse(res, 200, "Salary report fetched successfully.", report);
});

module.exports = {
  getMySalary,
  getEmployeeSalary,
  getSalaryReport,
};
