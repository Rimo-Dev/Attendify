const express = require('express');
const router = express.Router();
const {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, adminOnly, getEmployees)
    .post(protect, adminOnly, createEmployee);

router.route('/:id')
    .get(protect, adminOnly, getEmployeeById)
    .put(protect, adminOnly, updateEmployee)
    .delete(protect, adminOnly, deleteEmployee);

module.exports = router;
