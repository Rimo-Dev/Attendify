const User = require('../models/User');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
    try {
        const employees = await User.find({}).select('-password');
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
        const employee = await User.findById(req.params.id).select('-password');
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
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
        const { name, email, password, role, baseSalary, shiftStartTime, shiftEndTime, department, designation } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const employee = await User.create({
            name,
            email,
            password,
            role: role || 'Employee',
            baseSalary: baseSalary || 0,
            shiftStartTime: shiftStartTime || '09:00',
            shiftEndTime: shiftEndTime || '17:00',
            department: department || '',
            designation: designation || ''
        });

        if (employee) {
            res.status(201).json({
                _id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role
            });
        } else {
            res.status(400).json({ message: 'Invalid employee data' });
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
            if (req.user.role === 'HR' && employee.role === 'Admin') {
                return res.status(403).json({ message: 'HR cannot modify Admin users' });
            }
            employee.name = req.body.name || employee.name;
            employee.email = req.body.email || employee.email;
            employee.role = req.body.role || employee.role;
            employee.status = req.body.status || employee.status;
            employee.baseSalary = req.body.baseSalary !== undefined ? req.body.baseSalary : employee.baseSalary;
            employee.shiftStartTime = req.body.shiftStartTime || employee.shiftStartTime;
            employee.shiftEndTime = req.body.shiftEndTime || employee.shiftEndTime;
            if (req.body.department !== undefined) employee.department = req.body.department;
            employee.designation = req.body.designation || employee.designation;

            if (req.body.password) {
                employee.password = req.body.password;
            }

            const updatedEmployee = await employee.save();

            res.json({
                _id: updatedEmployee._id,
                name: updatedEmployee.name,
                email: updatedEmployee.email,
                role: updatedEmployee.role
            });
        } else {
            res.status(404).json({ message: 'Employee not found' });
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
            if (req.user.role === 'HR' && employee.role === 'Admin') {
                return res.status(403).json({ message: 'HR cannot delete Admin users' });
            }
            await User.deleteOne({ _id: employee._id });
            res.json({ message: 'Employee removed' });
        } else {
            res.status(404).json({ message: 'Employee not found' });
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
    deleteEmployee
};
