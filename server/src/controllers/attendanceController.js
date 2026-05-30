const Attendance = require("../models/Attendance");
const sendEmail = require("../utils/emailSender");
const {
  toDateOnly,
  getMonthStart,
  getMonthEnd,
  getHolidaySetForMonth,
  isWorkingDay,
} = require("../utils/workingDays");

const getAttendanceBlockedMessage = async (date) => {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);
  const holidaySet = await getHolidaySetForMonth(monthStart, monthEnd);

  if (!isWorkingDay(date, holidaySet)) {
    return "Attendance is not allowed on weekends or company holidays";
  }

  return null;
};

const isAfterShiftEnd = (now, shiftEndTime) => {
  if (!shiftEndTime) {
    return false;
  }

  const [endHour, endMin] = String(shiftEndTime).split(":").map(Number);
  if (Number.isNaN(endHour) || Number.isNaN(endMin)) {
    return false;
  }

  const shiftEnd = new Date(now);
  shiftEnd.setHours(endHour, endMin, 0, 0);
  return now > shiftEnd;
};

// @desc    Check In
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res) => {
  try {
    const today = toDateOnly(new Date());
    const joinStart = toDateOnly(req.user.joiningDate || req.user.createdAt);

    if (today < joinStart) {
      return res.status(403).json({
        message: "Attendance is only available from the employee joining date",
      });
    }

    const blockedMessage = await getAttendanceBlockedMessage(today);
    if (blockedMessage) {
      return res.status(403).json({ message: blockedMessage });
    }

    if (isAfterShiftEnd(now, req.user.shiftEndTime)) {
      return res.status(403).json({
        message: "Attendance is not allowed after office hours end",
      });
    }

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today },
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    const now = new Date();

    // Calculate Late Duration
    const [shiftHour, shiftMin] = req.user.shiftStartTime
      .split(":")
      .map(Number);
    const shiftStartTime = new Date(now);
    shiftStartTime.setHours(shiftHour, shiftMin, 0, 0);

    let lateDuration = 0;
    let status = "Present";

    if (now > shiftStartTime) {
      const diffMs = now - shiftStartTime;
      lateDuration = Math.floor(diffMs / 60000); // in minutes
      status = "Late";

      // Send Late Notification Email asynchronously
      if (lateDuration > 0) {
        const message = `Dear ${req.user.name},\n\nYou checked in late today.\nCheck-in time: ${now.toLocaleTimeString()}\nOffice start time: ${req.user.shiftStartTime}\nLate duration: ${lateDuration} minutes.\n\nPlease ensure punctuality.\n\nRegards,\nAdmin`;

        sendEmail({
          email: req.user.email,
          subject: "Late Check-in Notification",
          message,
        });
      }
    }

    const attendance = await Attendance.create({
      employeeId: req.user._id,
      date: today,
      checkIn: now,
      status,
      lateDuration,
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check Out
// @route   PUT /api/attendance/check-out
// @access  Private
const checkOut = async (req, res) => {
  try {
    const today = toDateOnly(new Date());
    const joinStart = toDateOnly(req.user.joiningDate || req.user.createdAt);

    if (today < joinStart) {
      return res.status(403).json({
        message: "Attendance is only available from the employee joining date",
      });
    }

    const blockedMessage = await getAttendanceBlockedMessage(today);
    if (blockedMessage) {
      return res.status(403).json({ message: blockedMessage });
    }

    const attendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today },
    });

    if (!attendance) {
      return res.status(400).json({ message: "No check-in found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user attendance
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ employeeId: req.user._id }).sort(
      { date: -1 },
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all attendance (Admin/HR)
// @route   GET /api/attendance
// @access  Private/Admin
const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({})
      .populate("employeeId", "name email department designation")
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Admin
const updateAttendance = async (req, res) => {
  try {
    const { checkIn, checkOut, status, lateDuration } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    attendance.checkIn = checkIn || attendance.checkIn;
    attendance.checkOut = checkOut || attendance.checkOut;
    attendance.status = status || attendance.status;
    if (lateDuration !== undefined) {
      attendance.lateDuration = lateDuration;
    }

    const updatedAttendance = await attendance.save();
    res.json(updatedAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await Attendance.deleteOne({ _id: attendance._id });
    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
};
