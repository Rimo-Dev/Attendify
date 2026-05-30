const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const {
  toDateOnly,
  getMonthStart,
  getMonthEnd,
  getHolidaySetForMonth,
  isWorkingDay,
  countWorkingDays,
} = require("../utils/workingDays");

// @desc    Get Admin Dashboard Stats
// @route   GET /api/reports/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: "Employee" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = getMonthStart(today);
    const endOfMonth = getMonthEnd(today);
    const holidaySet = await getHolidaySetForMonth(startOfMonth, endOfMonth);

    // If today is not a working day (weekend or company holiday), there are no absentees
    if (!isWorkingDay(today, holidaySet)) {
      const attendancesToday = await Attendance.find({
        date: { $gte: today, $lte: endOfToday },
      });
      let presentCount = 0;
      let lateCount = 0;

      attendancesToday.forEach((att) => {
        if (att.status === "Present") presentCount++;
        if (att.status === "Late") {
          presentCount++; // Late is still present
          lateCount++;
        }
      });

      const leavesToday = await Leave.find({
        status: "Approved",
        startDate: { $lte: endOfToday },
        endDate: { $gte: today },
      }).populate("employeeId", "name email department");

      const onLeaveEmployees = leavesToday
        .filter((l) => l.employeeId)
        .map((l) => ({
          id: l.employeeId._id,
          name: l.employeeId.name,
          department: l.employeeId.department,
          type: l.type,
        }));

      const onLeaveCount = onLeaveEmployees.length;

      return res.json({
        totalEmployees,
        presentCount,
        absentCount: 0,
        lateCount,
        onLeaveCount,
        onLeaveEmployees,
      });
    }

    // For working days, compute absent employees precisely:
    // Absent = employees who are not on approved leave AND have no check-in/check-out record today
    const employees = await User.find({ role: "Employee" }).select(
      "_id name department",
    );

    const leavesToday = await Leave.find({
      status: "Approved",
      startDate: { $lte: endOfToday },
      endDate: { $gte: today },
    }).populate("employeeId", "_id name department");

    const onLeaveSet = new Set(
      leavesToday
        .filter((l) => l.employeeId)
        .map((l) => String(l.employeeId._id)),
    );

    const attendancesToday = await Attendance.find({
      date: { $gte: today, $lte: endOfToday },
    });

    // Consider an employee present if there's any checkIn or checkOut record for today
    const presentSet = new Set(
      attendancesToday
        .filter((a) => a.checkIn || a.checkOut)
        .map((a) => String(a.employeeId)),
    );

    let presentCount = 0;
    let lateCount = 0;

    attendancesToday.forEach((att) => {
      if (att.status === "Present") presentCount++;
      if (att.status === "Late") {
        presentCount++; // Late is still present
        lateCount++;
      }
    });

    const onLeaveEmployees = leavesToday
      .filter((l) => l.employeeId)
      .map((l) => ({
        id: l.employeeId._id,
        name: l.employeeId.name,
        department: l.employeeId.department,
        type: l.type,
      }));

    const onLeaveCount = onLeaveEmployees.length;

    let absentCount = 0;
    for (const emp of employees) {
      const idStr = String(emp._id);
      if (onLeaveSet.has(idStr)) continue;
      if (presentSet.has(idStr)) continue;
      absentCount++;
    }

    res.json({
      totalEmployees,
      presentCount,
      absentCount,
      lateCount,
      onLeaveCount,
      onLeaveEmployees,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Employee Performance Stats
// @route   GET /api/reports/employee/:id
// @access  Private/Admin
const getEmployeePerformance = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await User.findById(employeeId);

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const now = new Date();
    const today = toDateOnly(now);
    const startOfMonth = getMonthStart(today);
    const endOfMonth = getMonthEnd(today);
    const holidaySet = await getHolidaySetForMonth(startOfMonth, endOfMonth);

    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    let presentDays = 0;
    let lateDays = 0;
    let totalLateMinutes = 0;

    attendances.forEach((att) => {
      const attendanceDate = toDateOnly(att.date);

      if (!isWorkingDay(attendanceDate, holidaySet)) {
        return;
      }

      if (att.status === "Present" || att.status === "Late") presentDays++;
      if (att.status === "Late") {
        lateDays++;
        totalLateMinutes += att.lateDuration || 0;
      }
    });

    const joinDate = employee.joiningDate || employee.createdAt;
    const joinStart = toDateOnly(joinDate);
    const eligibleStart = joinStart > startOfMonth ? joinStart : startOfMonth;

    const totalWorkingDaysInMonth = Math.max(
      1,
      countWorkingDays(startOfMonth, endOfMonth, holidaySet),
    );

    const workingDaysPassed = countWorkingDays(
      eligibleStart,
      today,
      holidaySet,
    );

    const approvedLeaves = await Leave.find({
      employeeId,
      status: "Approved",
      $or: [{ startDate: { $lte: today }, endDate: { $gte: startOfMonth } }],
    });

    let leaveDaysPassed = 0;
    const cursor = new Date(eligibleStart);
    while (cursor <= today) {
      const current = toDateOnly(cursor);

      if (isWorkingDay(current, holidaySet)) {
        // Check if on approved leave
        for (const leave of approvedLeaves) {
          const ls = toDateOnly(leave.startDate);
          const le = toDateOnly(leave.endDate);
          if (current >= ls && current <= le) {
            leaveDaysPassed++;
            break;
          }
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    const absentDays = Math.max(
      0,
      workingDaysPassed - presentDays - leaveDaysPassed,
    );

    let score = 100;
    score -= absentDays * 10;
    score -= lateDays * 5;

    let rating = "Excellent";
    let color = "16, 185, 129"; // success green
    if (score < 50) {
      rating = "Unsatisfactory";
      color = "244, 63, 94"; // danger red
    } else if (score < 75) {
      rating = "Needs Improvement";
      color = "245, 158, 11"; // warning yellow
    } else if (score < 90) {
      rating = "Good";
      color = "59, 130, 246"; // primary blue
    }

    res.json({
      employeeName: employee.name,
      presentDays,
      lateDays,
      absentDays,
      workingDaysPassed,
      workingDaysInMonth: totalWorkingDaysInMonth,
      totalLateMinutes,
      score: Math.max(0, score),
      rating,
      color,
      month: startOfMonth.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getEmployeePerformance };
