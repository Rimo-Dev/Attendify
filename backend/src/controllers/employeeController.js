const { body, query } = require("express-validator");
const Employee = require("../models/Employee");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const { ROLES } = require("../utils/constants");

const employeeValidators = [
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(ROLES),
  body("employeeId").notEmpty(),
  body("department").notEmpty(),
  body("designation").notEmpty(),
  body("joiningDate").isISO8601(),
  body("monthlySalary").isFloat({ min: 0 }),
];

const employeeUpdateValidators = [
  body("name").optional().notEmpty(),
  body("email").optional().isEmail(),
  body("role").optional().isIn(ROLES),
  body("joiningDate").optional().isISO8601(),
  body("monthlySalary").optional().isFloat({ min: 0 }),
];

const employeeQueryValidators = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password, role, employeeId, ...employeeFields } = req.body;
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const existingEmployee = await Employee.findOne({ employeeId });
  if (existingEmployee) {
    throw new ApiError(409, "Employee ID already exists.");
  }

  const employee = await Employee.create({ employeeId, ...employeeFields });
  const user = await User.create({
    name,
    email,
    password,
    role,
    employee: employee._id,
  });

  employee.user = user._id;
  await employee.save();
  await employee.populate("user");

  return sendResponse(res, 201, "Employee created successfully.", employee);
});

const getEmployees = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.department) {
    filter.department = req.query.department;
  }
  if (req.query.designation) {
    filter.designation = req.query.designation;
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const [items, total] = await Promise.all([
    Employee.find(filter).populate("user").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Employees fetched successfully.", {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate("user");
  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  return sendResponse(res, 200, "Employee fetched successfully.", employee);
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate("user");
  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  ["employeeId", "department", "designation", "phone", "address", "joiningDate", "monthlySalary", "leaveBalance", "avatar"].forEach(
    (field) => {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    }
  );

  if (employee.user) {
    ["name", "role"].forEach((field) => {
      if (req.body[field] !== undefined) {
        employee.user[field] = req.body[field];
      }
    });
    if (req.body.email) {
      employee.user.email = req.body.email.toLowerCase();
    }
    await employee.user.save();
  }

  await employee.save();
  return sendResponse(res, 200, "Employee updated successfully.", employee);
});

const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  employee.isActive = req.body.isActive;
  await employee.save();

  if (employee.user) {
    await User.findByIdAndUpdate(employee.user, { isActive: req.body.isActive });
  }

  return sendResponse(res, 200, "Employee status updated successfully.", employee);
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  if (employee.user) {
    await User.findByIdAndDelete(employee.user);
  }

  await employee.deleteOne();
  return sendResponse(res, 200, "Employee deleted successfully.");
});

module.exports = {
  employeeValidators,
  employeeUpdateValidators,
  employeeQueryValidators,
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
};
