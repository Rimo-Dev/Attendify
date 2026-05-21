const User = require("../models/User");

// Helper to escape user-supplied department strings for regex
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
  try {
    // Role-based filtering:
    // - Admin: should not see Admin users (hide admin accounts in admin panel)
    // - HR: should only see users with role 'Employee' within their department
    // - Fallback: return no users
    let filter = {};

    if (req.user && req.user.role === "Admin") {
      filter = { role: { $ne: "Admin" } };
    } else if (req.user && req.user.role === "HR") {
      // HR should see all users except Admin and themselves
      filter = { role: { $ne: "Admin" }, _id: { $ne: req.user._id } };
    } else {
      return res.status(403).json({ message: "Not authorized to view users" });
    }

    const employees = await User.find(filter).select("-password");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private/Admin
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select("-password");
    if (employee) {
      // HR cannot view Admin users or their own user record
      if (req.user && req.user.role === "HR") {
        if (
          employee.role === "Admin" ||
          String(employee._id) === String(req.user._id)
        ) {
          return res
            .status(403)
            .json({ message: "Not authorized to view this user" });
        }
      }
      // Admin should not see Admin accounts in the admin panel
      if (req.user && req.user.role === "Admin" && employee.role === "Admin") {
        return res
          .status(403)
          .json({ message: "Not authorized to view this user" });
      }
      res.json(employee);
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      baseSalary,
      shiftStartTime,
      shiftEndTime,
      department,
      designation,
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Prevent creating department names that look like roles
    if (department === "HR" || department === "Admin") {
      return res.status(400).json({ message: "Invalid department name" });
    }

    // If requester is HR, force created user to be an Employee
    let createRole = role || "Employee";
    if (req.user && req.user.role === "HR") {
      createRole = "Employee";
    }

    const employee = await User.create({
      name,
      email,
      password,
      role: createRole,
      baseSalary: baseSalary || 0,
      shiftStartTime: shiftStartTime || "09:00",
      shiftEndTime: shiftEndTime || "17:00",
      department: department || "",
      designation: designation || "",
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      });
    } else {
      res.status(400).json({ message: "Invalid employee data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (employee) {
      // If requester is HR, they may only modify Employee users
      if (req.user.role === "HR") {
        if (employee.role !== "Employee") {
          return res
            .status(403)
            .json({ message: "HR cannot modify Admin or HR users" });
        }
      }
      const canEditRole = req.user.role === "Admin";

      employee.name = req.body.name || employee.name;
      employee.email = req.body.email || employee.email;
      employee.baseSalary =
        req.body.baseSalary !== undefined
          ? req.body.baseSalary
          : employee.baseSalary;
      employee.shiftStartTime =
        req.body.shiftStartTime || employee.shiftStartTime;
      employee.shiftEndTime = req.body.shiftEndTime || employee.shiftEndTime;
      if (req.body.department !== undefined) {
        const newDept = req.body.department || "";
        // Disallow departments named after roles
        if (newDept === "HR" || newDept === "Admin") {
          return res.status(400).json({ message: "Invalid department name" });
        }
        // HR is allowed to set department for Employee users
        employee.department = newDept;
      }
      employee.designation = req.body.designation || employee.designation;
      if (req.body.joiningDate !== undefined) {
        employee.joiningDate = req.body.joiningDate
          ? new Date(req.body.joiningDate)
          : null;
      }

      if (canEditRole) {
        employee.role = req.body.role || employee.role;
        employee.status = req.body.status || employee.status;
        if (req.body.password) {
          employee.password = req.body.password;
        }
      } else {
        if (req.body.password) {
          return res
            .status(403)
            .json({ message: "HR cannot change passwords" });
        }
        // HR cannot change role/status
        if (req.user.role === "HR" && (req.body.role || req.body.status)) {
          return res
            .status(403)
            .json({ message: "HR cannot change role or status" });
        }
      }

      const updatedEmployee = await employee.save();

      res.json({
        _id: updatedEmployee._id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        role: updatedEmployee.role,
      });
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (employee) {
      // HR can only delete Employee users (no Admin/HR deletions)
      if (req.user && req.user.role === "HR") {
        if (employee.role !== "Employee") {
          return res
            .status(403)
            .json({ message: "HR cannot delete Admin or HR users" });
        }
      }

      await User.deleteOne({ _id: employee._id });
      res.json({ message: "Employee removed" });
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
