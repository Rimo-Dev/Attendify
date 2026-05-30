const Leave = require("../models/Leave");

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Calculate days requested
    const timeDiff = endDateObj.getTime() - startDateObj.getTime();
    const daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (daysRequested <= 0) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkStart = new Date(startDateObj);
    checkStart.setHours(0, 0, 0, 0);

    if (checkStart < today) {
      return res
        .status(400)
        .json({ message: "Cannot apply for a leave in the past." });
    }

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    if (endDateObj > oneYearFromNow) {
      return res
        .status(400)
        .json({
          message: "Cannot apply for a leave more than 1 year in advance.",
        });
    }

    if (type === "Annual") {
      const joinDate = req.user.joiningDate || req.user.createdAt;
      const joinDateObj = new Date(joinDate);
      const currentDate = new Date();

      let months = (currentDate.getFullYear() - joinDateObj.getFullYear()) * 12;
      months -= joinDateObj.getMonth();
      months += currentDate.getMonth();

      if (currentDate.getDate() < joinDateObj.getDate()) {
        months--;
      }

      if (months < 6) {
        return res
          .status(400)
          .json({
            message:
              "You must complete 6 months of service to be eligible for Annual Leave.",
          });
      }
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const existingLeaves = await Leave.find({
      employeeId: req.user._id,
      type: type,
      status: { $ne: "Rejected" },
      startDate: { $gte: startOfYear, $lte: endOfYear },
    });

    let usedDays = 0;
    existingLeaves.forEach((l) => {
      const ls = new Date(l.startDate);
      const le = new Date(l.endDate);
      const diff = le.getTime() - ls.getTime();
      usedDays += Math.ceil(diff / (1000 * 3600 * 24)) + 1;
    });

    const limits = {
      Casual: 10,
      Sick: 14,
      Annual: 21,
    };

    const limit = limits[type] || 0;

    if (usedDays + daysRequested > limit) {
      return res.status(400).json({
        message: `Exceeds annual limit for ${type} leave. Limit: ${limit} days, Used/Pending: ${usedDays} days`,
      });
    }

    const leave = await Leave.create({
      employeeId: req.user._id,
      startDate,
      endDate,
      type,
      reason,
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
    const leaves = await Leave.find({ employeeId: req.user._id }).sort({
      createdAt: -1,
    });
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
    const leaves = await Leave.find({})
      .populate("employeeId", "name email role")
      .sort({ createdAt: -1 });
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
      await leave.populate("employeeId");

      if (leave.employeeId.role === "HR") {
        if (req.user.role !== "Admin") {
          return res
            .status(403)
            .json({ message: "Only Admin can update HR leave status" });
        }
      } else {
        if (req.user.role !== "HR") {
          return res
            .status(403)
            .json({ message: "Only HR can update Employee leave status" });
        }
      }

      leave.status = status;
      await leave.save();
      res.json(leave);
    } else {
      res.status(404).json({ message: "Leave not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete leave
// @route   DELETE /api/leaves/:id
// @access  Private
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    await leave.populate("employeeId");

    let canDelete = false;
    if (leave.employeeId._id.toString() === req.user._id.toString()) {
      if (leave.status === "Pending") canDelete = true;
    } else if (leave.employeeId.role === "HR" && req.user.role === "Admin") {
      canDelete = true;
    } else if (leave.employeeId.role === "Employee" && req.user.role === "HR") {
      canDelete = true;
    }

    if (!canDelete) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this leave" });
    }

    await Leave.deleteOne({ _id: leave._id });
    res.json({ message: "Leave deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update leave details
// @route   PUT /api/leaves/edit/:id
// @access  Private
const updateLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    await leave.populate("employeeId");

    let canEdit = false;
    if (leave.employeeId._id.toString() === req.user._id.toString()) {
      if (leave.status === "Pending") canEdit = true;
    } else if (leave.employeeId.role === "HR" && req.user.role === "Admin") {
      canEdit = true;
    } else if (leave.employeeId.role === "Employee" && req.user.role === "HR") {
      canEdit = true;
    }

    if (!canEdit) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this leave" });
    }

    const startDateObj = new Date(startDate || leave.startDate);
    const endDateObj = new Date(endDate || leave.endDate);
    const typeToCheck = type || leave.type;

    const timeDiff = endDateObj.getTime() - startDateObj.getTime();
    const daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (daysRequested <= 0) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkStart = new Date(startDateObj);
    checkStart.setHours(0, 0, 0, 0);

    if (checkStart < today) {
      return res
        .status(400)
        .json({ message: "Cannot apply for a leave in the past." });
    }

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    if (endDateObj > oneYearFromNow) {
      return res
        .status(400)
        .json({
          message: "Cannot apply for a leave more than 1 year in advance.",
        });
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const existingLeaves = await Leave.find({
      employeeId: leave.employeeId,
      type: typeToCheck,
      status: { $ne: "Rejected" },
      _id: { $ne: leave._id },
      startDate: { $gte: startOfYear, $lte: endOfYear },
    });

    let usedDays = 0;
    existingLeaves.forEach((l) => {
      const ls = new Date(l.startDate);
      const le = new Date(l.endDate);
      const diff = le.getTime() - ls.getTime();
      usedDays += Math.ceil(diff / (1000 * 3600 * 24)) + 1;
    });

    const limits = { Casual: 10, Sick: 14, Annual: 21 };
    const limit = limits[typeToCheck] || 0;

    if (usedDays + daysRequested > limit) {
      return res.status(400).json({
        message: `Exceeds annual limit for ${typeToCheck} leave. Limit: ${limit} days, Used/Pending: ${usedDays} days`,
      });
    }

    leave.startDate = startDate || leave.startDate;
    leave.endDate = endDate || leave.endDate;
    leave.type = type || leave.type;
    leave.reason = reason || leave.reason;

    const updatedLeave = await leave.save();
    const populatedLeave = await updatedLeave.populate(
      "employeeId",
      "name email",
    );
    res.json(populatedLeave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  deleteLeave,
  updateLeave,
};
