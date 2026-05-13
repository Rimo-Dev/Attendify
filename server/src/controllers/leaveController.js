const Leave = require('../models/Leave');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
    try {
        const { startDate, endDate, type, reason } = req.body;

        const leave = await Leave.create({
            employeeId: req.user._id,
            startDate,
            endDate,
            type,
            reason
        });

        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my leaves
// @route   GET /api/leaves/my
// @access  Private
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private/Admin
const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({}).populate('employeeId', 'name email').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update leave status (Approve/Reject)
// @route   PUT /api/leaves/:id
// @access  Private/Admin
const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        
        const leave = await Leave.findById(req.params.id);
        
        if (leave) {
            leave.status = status;
            await leave.save();
            res.json(leave);
        } else {
            res.status(404).json({ message: 'Leave not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus
};
