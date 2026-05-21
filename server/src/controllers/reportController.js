const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

// @desc    Get Admin Dashboard Stats
// @route   GET /api/reports/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Count Employee and HR users as staff for attendance
    const employeeCount = await User.countDocuments({ role: "Employee" });
    const hrCount = await User.countDocuments({ role: "HR" });
    const totalEmployees = employeeCount + hrCount; // kept the same response key for UI compatibility

    // Calculate today range (start of today to start of tomorrow)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    // Get staff IDs to restrict attendance counting to Employee + HR only
    const staffUsers = await User.find({
      role: { $in: ["Employee", "HR"] },
    }).select("_id");
    const staffIds = staffUsers.map((u) => u._id);

    // Fetch attendances strictly within today for staff only
    const attendancesToday = await Attendance.find({
      date: { $gte: startOfToday, $lt: startOfTomorrow },
      employeeId: { $in: staffIds },
    });

    // Use sets to count unique employees who checked in today
    const presentSet = new Set();
    const lateSet = new Set();

    attendancesToday.forEach((att) => {
      const empId = String(
        att.employeeId || att.employee || att.employee_id || "",
      );
      if (!empId) return;
      if (att.status === "Present" || att.status === "Late") {
        presentSet.add(empId);
      }
      if (att.status === "Late") {
        lateSet.add(empId);
      }
    });

    const presentCount = presentSet.size;
    const lateCount = lateSet.size;

    // Determine approved leaves overlapping today for staff (so we don't mark them absent)
    const leavesToday = await Leave.find({
      status: "Approved",
      startDate: { $lt: startOfTomorrow },
      endDate: { $gte: startOfToday },
      employeeId: { $in: staffIds },
    }).select("employeeId");

    const onLeaveSet = new Set(
      leavesToday.map((l) => String(l.employeeId && l.employeeId.toString())),
    );

    // Exclude on-leave staff who are not present from the absent count
    let onLeaveNotPresentCount = 0;
    onLeaveSet.forEach((id) => {
      if (!presentSet.has(id)) onLeaveNotPresentCount += 1;
    });

    const absentCount = Math.max(
      0,
      totalEmployees - presentCount - onLeaveNotPresentCount,
    );

    res.json({
      totalEmployees,
      presentCount,
      absentCount,
      lateCount,
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

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: startOfMonth },
    });

    let presentDays = 0;
    let lateDays = 0;
    let totalLateMinutes = 0;

    attendances.forEach((att) => {
      if (att.status === "Present" || att.status === "Late") presentDays++;
      if (att.status === "Late") {
        lateDays++;
        totalLateMinutes += att.lateDuration || 0;
      }
    });

    const today = new Date();
    let daysPassed = today.getDate();
    let workingDaysPassed = 0;
    for (let i = 1; i <= daysPassed; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i);
      if (d.getDay() !== 0 && d.getDay() !== 6) workingDaysPassed++;
    }

    const absentDays = Math.max(0, workingDaysPassed - presentDays);

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
