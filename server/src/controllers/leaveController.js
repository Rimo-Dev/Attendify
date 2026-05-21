const Leave = require("../models/Leave");

const DAY_MS = 24 * 60 * 60 * 1000;

const getPeriodRange = (type, referenceDate = new Date()) => {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  if (type === "Casual" || type === "Sick") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setFullYear(referenceDate.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  end.setFullYear(referenceDate.getFullYear(), 11, 31);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getLeaveLimit = (type) => {
  if (type === "Casual") return 1;
  if (type === "Sick") return 2;
  if (type === "Annual") return 1.5;
  return null;
};

const getLeaveLimitWindowLabel = (type) => {
  if (type === "Casual") return "per month";
  if (type === "Sick") return "per month";
  if (type === "Annual") return "per year";
  return "";
};

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getRequestedLeaveDays = ({ startDate, endDate, days }) => {
  const parsedDays = Number(days);
  if (Number.isFinite(parsedDays) && parsedDays > 0) {
    return parsedDays;
  }

  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  return Math.max(1, Math.round((end - start) / DAY_MS + 1));
};

const getEffectiveReferenceDate = (type, startDate, endDate) => {
  if (type === "Sick") {
    return normalizeDate(endDate || startDate || Date.now());
  }
  return normalizeDate(startDate || Date.now());
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason, days } = req.body;

    if (!startDate || !endDate || !type || !reason) {
      return res.status(400).json({ message: "All leave fields are required" });
    }

    const requestedDays = getRequestedLeaveDays({ startDate, endDate, days });
    const today = normalizeDate(Date.now());
    const leaveStart = normalizeDate(startDate);
    const leaveEnd = normalizeDate(endDate);

    if (leaveEnd < leaveStart) {
      return res
        .status(400)
        .json({ message: "End date cannot be before start date" });
    }

    if (type === "Casual") {
      const minAllowedDate = new Date(today);
      minAllowedDate.setDate(minAllowedDate.getDate() + 1);
      if (leaveStart < minAllowedDate) {
        return res.status(400).json({
          message:
            "Casual leave must be applied at least 1 day before the leave date.",
        });
      }
    }

    if (type === "Sick") {
      const earliestAllowedDate = new Date(today);
      earliestAllowedDate.setDate(earliestAllowedDate.getDate() - 1);
      const latestAllowedDate = new Date(today);
      if (leaveStart < earliestAllowedDate || leaveStart > latestAllowedDate) {
        return res.status(400).json({
          message:
            "Sick leave can only be applied on the same day or the next day.",
        });
      }
    }

    if (type === "Annual") {
      const minAllowedDate = new Date(today);
      minAllowedDate.setDate(minAllowedDate.getDate() + 7);
      if (leaveStart < minAllowedDate) {
        return res.status(400).json({
          message:
            "Annual leave must be applied at least 7 days before the leave date.",
        });
      }
    }

    const limit = getLeaveLimit(type);
    const limitDays = Number(limit);

    if (limit) {
      const { start, end } = getPeriodRange(
        type,
        getEffectiveReferenceDate(type, startDate, endDate),
      );
      const existingLeaves = await Leave.find({
        employeeId: req.user._id,
        type,
        status: { $in: ["Pending", "Approved"] },
        startDate: { $gte: start, $lte: end },
      });

      const usedDays = existingLeaves.reduce((total, leave) => {
        const leaveDays = Number(leave.days) || getRequestedLeaveDays(leave);
        return total + leaveDays;
      }, 0);

      if (usedDays + requestedDays > limitDays) {
        return res.status(400).json({
          message: `${type} leave limit reached ${getLeaveLimitWindowLabel(type)}.`,
        });
      }
    }

    const leave = await Leave.create({
      employeeId: req.user._id,
      startDate,
      endDate,
      type,
      reason,
      days: requestedDays,
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
// @access  Private/Admin or HR depending on requester role
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'

    const leave = await Leave.findById(req.params.id).populate(
      "employeeId",
      "name email role",
    );

    if (leave) {
      // Prevent HR from approving/rejecting their own leave requests
      if (
        req.user.role === "HR" &&
        leave.employeeId?._id?.toString() === req.user._id?.toString()
      ) {
        return res.status(403).json({
          message:
            "HR cannot approve or reject their own leave requests. Admin approval is required.",
        });
      }
      const requesterRole = leave.employeeId?.role;
      const approverRole = req.user.role;

      if (requesterRole === "Employee" && approverRole !== "HR") {
        return res.status(403).json({
          message: "Only HR can approve or reject employee leave requests",
        });
      }

      if (requesterRole === "HR" && approverRole !== "Admin") {
        return res.status(403).json({
          message: "Only Admin can approve or reject HR leave requests",
        });
      }

      if (requesterRole !== "Employee" && requesterRole !== "HR") {
        return res.status(403).json({
          message:
            "Leave approval is only supported for Employee or HR requests",
        });
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

// @desc    Edit a leave (HR/Admin)
// @route   PATCH /api/leaves/:id
// @access  Private/Admin or HR
const editLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason, days } = req.body;

    const leave = await Leave.findById(req.params.id).populate(
      "employeeId",
      "name email role",
    );

    if (!leave) return res.status(404).json({ message: "Leave not found" });

    const targetRole = leave.employeeId?.role;
    const requesterRole = req.user.role;

    if (
      targetRole === "Employee" &&
      requesterRole !== "HR" &&
      requesterRole !== "Admin"
    ) {
      return res
        .status(403)
        .json({ message: "Only HR or Admin can edit employee leaves" });
    }

    if (targetRole === "HR" && requesterRole !== "Admin") {
      return res.status(403).json({ message: "Only Admin can edit HR leaves" });
    }

    // basic validation if dates/types provided
    if (startDate && endDate) {
      const leaveStart = normalizeDate(startDate);
      const leaveEnd = normalizeDate(endDate);
      if (leaveEnd < leaveStart) {
        return res
          .status(400)
          .json({ message: "End date cannot be before start date" });
      }
    }

    if (type && !["Sick", "Casual", "Annual"].includes(type)) {
      return res.status(400).json({ message: "Invalid leave type" });
    }

    // apply updates
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (type) leave.type = type;
    if (reason) leave.reason = reason;
    // recalc days
    leave.days = getRequestedLeaveDays({
      startDate: leave.startDate,
      endDate: leave.endDate,
      days,
    });

    await leave.save();
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a leave (HR/Admin)
// @route   DELETE /api/leaves/:id
// @access  Private/Admin or HR
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate(
      "employeeId",
      "name email role",
    );

    if (!leave) return res.status(404).json({ message: "Leave not found" });

    const targetRole = leave.employeeId?.role;
    const requesterRole = req.user.role;

    if (
      targetRole === "Employee" &&
      requesterRole !== "HR" &&
      requesterRole !== "Admin"
    ) {
      return res
        .status(403)
        .json({ message: "Only HR or Admin can delete employee leaves" });
    }

    if (targetRole === "HR" && requesterRole !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only Admin can delete HR leaves" });
    }

    await Leave.deleteOne({ _id: leave._id });
    res.json({ message: "Leave deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get approved leaves overlapping today
// @route   GET /api/leaves/onleave
// @access  Private/Admin or HR
const getOnLeave = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const leaves = await Leave.find({
      status: "Approved",
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
    })
      .populate("employeeId", "name email role")
      .sort({ startDate: 1 });

    // If requester is HR, only show Employee leaves; Admin sees all
    if (req.user && req.user.role === "HR") {
      const employeeLeaves = leaves.filter(
        (l) => l.employeeId && l.employeeId.role === "Employee",
      );
      return res.json(employeeLeaves);
    }

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  editLeave,
  deleteLeave,
  getOnLeave,
};
