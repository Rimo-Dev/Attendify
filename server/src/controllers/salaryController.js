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

// @desc    Get Salary Prediction for Employee
// @route   GET /api/salary/predict
// @access  Private
const predictSalary = async (req, res) => {
  try {
    let employeeId = req.user._id;

    if (req.params.id) {
      if (req.user.role === "Admin" || req.user.role === "HR") {
        employeeId = req.params.id;
      } else if (req.params.id !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const baseSalary = employee.baseSalary || 0;

    const now = toDateOnly(new Date());
    const joinDate = employee.joiningDate || employee.createdAt;
    const joinStart = toDateOnly(joinDate);
    const targetMonthAnchor = joinStart > now ? joinStart : now;

    // Calculate the effective month for salary/attendance
    const firstDay = getMonthStart(targetMonthAnchor);
    const lastDay = getMonthEnd(targetMonthAnchor);
    const holidaySet = await getHolidaySetForMonth(firstDay, lastDay);

    const totalWorkingDaysInMonth = Math.max(
      1,
      countWorkingDays(firstDay, lastDay, holidaySet),
    );

    const eligibleStart = joinStart > firstDay ? joinStart : firstDay;
    const paidWorkingDays = countWorkingDays(
      eligibleStart,
      lastDay,
      holidaySet,
    );

    // Find attendance this month
    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: firstDay, $lte: lastDay },
    });

    // Calculate metrics
    let presentDays = 0;
    let lateDays = 0;
    let totalLateMinutes = 0;

    attendances.forEach((att) => {
      const attendanceDate = toDateOnly(att.date);

      // Only count attendance on business days.
      if (!isWorkingDay(attendanceDate, holidaySet)) {
        return;
      }

      if (att.status === "Present") presentDays++;
      if (att.status === "Late") {
        presentDays++; // Count late as present but note the late
        lateDays++;
        totalLateMinutes += att.lateDuration;
      }
    });

    // Simplified salary logic
    // E.g., deduct 0.5 day salary for every 3 late days
    const latePenaltyDays = Math.floor(lateDays / 3) * 0.5;

    const dailyRate = baseSalary / totalWorkingDaysInMonth;
    const proratedGrossSalary = dailyRate * paidWorkingDays;

    // Find approved leaves this month
    const approvedLeaves = await Leave.find({
      employeeId,
      status: "Approved",
      $or: [{ startDate: { $lte: lastDay }, endDate: { $gte: firstDay } }],
    });

    // We calculate absent days up to today, not the end of the month
    let workingDaysPassed = 0;
    let leaveDaysPassed = 0;
    const daysPassed = now.getDate();
    for (let i = 1; i <= daysPassed; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      const dStart = toDateOnly(d);

      if (dStart >= joinStart) {
        if (isWorkingDay(dStart, holidaySet)) {
          workingDaysPassed++;

          // Check if on approved leave
          for (const leave of approvedLeaves) {
            const ls = toDateOnly(leave.startDate);
            const le = toDateOnly(leave.endDate);
            if (dStart >= ls && dStart <= le) {
              leaveDaysPassed++;
              break;
            }
          }
        }
      }
    }

    const absentDays = Math.max(
      0,
      workingDaysPassed - presentDays - leaveDaysPassed,
    );

    const lateDeduction = latePenaltyDays * dailyRate;
    const absentDeduction = absentDays * dailyRate;
    const predictedSalary = Math.max(
      0,
      proratedGrossSalary - lateDeduction - absentDeduction,
    );

    const breakdown = [
      {
        id: 1,
        type: "Earnings",
        description: `Prorated Salary (${paidWorkingDays} days @ ${dailyRate.toFixed(2)}/day)`,
        amount: proratedGrossSalary.toFixed(2),
        isDeduction: false,
      },
      {
        id: 2,
        type: "Deduction",
        description: `Absences (${absentDays} days @ ${dailyRate.toFixed(2)}/day)`,
        amount: absentDeduction.toFixed(2),
        isDeduction: true,
      },
      {
        id: 3,
        type: "Deduction",
        description: `Late Penalty (${lateDays} days late -> ${latePenaltyDays} penalty days @ ${dailyRate.toFixed(2)}/day)`,
        amount: lateDeduction.toFixed(2),
        isDeduction: true,
      },
    ];

    res.json({
      employeeName: employee.name,
      baseSalary,
      workingDaysInMonth: totalWorkingDaysInMonth,
      paidWorkingDays,
      presentDays,
      absentDays,
      lateDays,
      totalLateMinutes,
      lateDeduction: lateDeduction.toFixed(2),
      absentDeduction: absentDeduction.toFixed(2),
      predictedSalary: predictedSalary.toFixed(2),
      currency: "৳",
      breakdown,
      dailyRate: dailyRate.toFixed(2),
      proratedGrossSalary: proratedGrossSalary.toFixed(2),
      month: firstDay.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      appointmentMonth: joinStart.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { predictSalary };
