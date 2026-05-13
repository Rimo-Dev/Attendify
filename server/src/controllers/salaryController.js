const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// @desc    Get Salary Prediction for Employee
// @route   GET /api/salary/predict
// @access  Private
const predictSalary = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const employee = await User.findById(employeeId);
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const baseSalary = employee.baseSalary || 0;
        
        // Calculate current month's start and end dates
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const workingDaysInMonth = 22; // Assuming 22 average working days per month
        
        // Find attendance this month
        const attendances = await Attendance.find({
            employeeId,
            date: { $gte: firstDay, $lte: lastDay }
        });
        
        // Calculate metrics
        let presentDays = 0;
        let lateDays = 0;
        let totalLateMinutes = 0;
        
        attendances.forEach(att => {
            if (att.status === 'Present') presentDays++;
            if (att.status === 'Late') {
                presentDays++; // Count late as present but note the late
                lateDays++;
                totalLateMinutes += att.lateDuration;
            }
        });

        // Simplified salary logic
        // E.g., deduct 0.5 day salary for every 3 late days
        const latePenaltyDays = Math.floor(lateDays / 3) * 0.5;
        
        const dailyRate = baseSalary / workingDaysInMonth;
        const absentDays = Math.max(0, workingDaysInMonth - presentDays);
        
        const lateDeduction = latePenaltyDays * dailyRate;
        const absentDeduction = absentDays * dailyRate;
        
        const predictedSalary = baseSalary - lateDeduction - absentDeduction;

        res.json({
            baseSalary,
            workingDaysInMonth,
            presentDays,
            absentDays,
            lateDays,
            totalLateMinutes,
            lateDeduction: lateDeduction.toFixed(2),
            absentDeduction: absentDeduction.toFixed(2),
            predictedSalary: predictedSalary.toFixed(2),
            currency: '৳'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { predictSalary };
