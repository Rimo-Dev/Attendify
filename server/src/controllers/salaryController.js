const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const Leave = require("../models/Leave");
const Announcement = require("../models/Announcement");

const buildDayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const getWorkingDays = (startDate, endDate, holidaySet) => {
  let workingDays = 0;

  for (
    let day = new Date(startDate);
    day <= endDate;
    day.setDate(day.getDate() + 1)
  ) {
    const dayOfWeek = day.getDay();

    // Exclude Fridays (5) and Saturdays (6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      continue;
    }

    if (holidaySet.has(buildDayKey(day))) {
      continue;
    }

    workingDays++;
  }

  return workingDays;
};

const addAnnouncementHolidayDays = ({
  announcements,
  rangeStart,
  rangeEnd,
  map,
}) => {
  const mapRef = map || new Map();

  announcements.forEach((announcement) => {
    let start =
      announcement.holidayStartDate ||
      announcement.holidayDate ||
      announcement.holidayEndDate ||
      null;
    let end =
      announcement.holidayEndDate ||
      announcement.holidayDate ||
      announcement.holidayStartDate ||
      null;

    if (!start || !end) {
      return;
    }

    start = new Date(start);
    end = new Date(end);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    const effectiveStart = start < rangeStart ? new Date(rangeStart) : start;
    const effectiveEnd = end > rangeEnd ? new Date(rangeEnd) : end;
    effectiveStart.setHours(0, 0, 0, 0);
    effectiveEnd.setHours(0, 0, 0, 0);

    for (
      let day = new Date(effectiveStart);
      day <= effectiveEnd;
      day.setDate(day.getDate() + 1)
    ) {
      const key = buildDayKey(day);
      if (!mapRef.has(key)) {
        mapRef.set(
          key,
          announcement.holidayName || announcement.title || "Holiday",
        );
      }
    }
  });

  return mapRef;
};

// @desc    Get Salary Prediction for Employee
// @route   GET /api/salary/predict
// @access  Private
const predictSalary = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const baseSalary = employee.baseSalary || 0;
    const gracePeriodMinutes = 5;

    // Shift Time Calculation
    const [shiftStartHour, shiftStartMin] = String(
      employee.shiftStartTime || "09:00",
    )
      .split(":")
      .map(Number);

    const [shiftEndHour, shiftEndMin] = String(employee.shiftEndTime || "17:00")
      .split(":")
      .map(Number);

    const shiftStartTotalMinutes = shiftStartHour * 60 + shiftStartMin;
    const shiftEndTotalMinutes = shiftEndHour * 60 + shiftEndMin;

    // Current Date Setup
    const currentDate = new Date();
    const today = new Date(currentDate);
    today.setHours(23, 59, 59, 999);

    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );
    monthEnd.setHours(23, 59, 59, 999);

    // Employee Joining Date
    // If no joiningDate exists, fallback to createdAt
    let employeeJoiningDate = employee.joiningDate
      ? new Date(employee.joiningDate)
      : employee.createdAt
        ? new Date(employee.createdAt)
        : today;

    employeeJoiningDate.setHours(0, 0, 0, 0);

    // 30-day salary cycle starting from joining date
    // Calculate which 30-day cycle the employee is currently in
    const daysSinceJoining = Math.floor(
      (today - employeeJoiningDate) / (1000 * 60 * 60 * 24),
    );
    const cycleNumber = Math.floor(daysSinceJoining / 30);

    const salaryPeriodStart = new Date(employeeJoiningDate);
    salaryPeriodStart.setDate(salaryPeriodStart.getDate() + cycleNumber * 30);
    salaryPeriodStart.setHours(0, 0, 0, 0);

    const salaryPeriodEnd = new Date(salaryPeriodStart);
    salaryPeriodEnd.setDate(salaryPeriodEnd.getDate() + 29); // 30 days total (0-29)
    salaryPeriodEnd.setHours(23, 59, 59, 999);

    const [
      salaryPeriodHolidayDocs,
      monthHolidayDocs,
      salaryAnnouncementHolidays,
      monthAnnouncementHolidays,
    ] = await Promise.all([
      Holiday.find({
        date: { $gte: salaryPeriodStart, $lte: salaryPeriodEnd },
      }).select("date"),
      Holiday.find({
        date: { $gte: monthStart, $lte: monthEnd },
      })
        .select("name date")
        .sort({ date: 1, _id: 1 }),
      Announcement.find({
        $or: [
          { holidayDate: { $gte: salaryPeriodStart, $lte: salaryPeriodEnd } },
          {
            holidayStartDate: {
              $gte: salaryPeriodStart,
              $lte: salaryPeriodEnd,
            },
          },
          {
            holidayEndDate: { $gte: salaryPeriodStart, $lte: salaryPeriodEnd },
          },
          {
            holidayStartDate: { $lte: salaryPeriodEnd },
            holidayEndDate: { $gte: salaryPeriodStart },
          },
        ],
      }).select(
        "title holidayName holidayDate holidayStartDate holidayEndDate",
      ),
      Announcement.find({
        $or: [
          { holidayDate: { $gte: monthStart, $lte: monthEnd } },
          { holidayStartDate: { $gte: monthStart, $lte: monthEnd } },
          { holidayEndDate: { $gte: monthStart, $lte: monthEnd } },
          {
            holidayStartDate: { $lte: monthEnd },
            holidayEndDate: { $gte: monthStart },
          },
        ],
      }).select(
        "title holidayName holidayDate holidayStartDate holidayEndDate",
      ),
    ]);

    const holidaySet = new Set(
      salaryPeriodHolidayDocs.map((holiday) =>
        buildDayKey(new Date(holiday.date)),
      ),
    );

    const salaryHolidayMap = addAnnouncementHolidayDays({
      announcements: salaryAnnouncementHolidays,
      rangeStart: salaryPeriodStart,
      rangeEnd: salaryPeriodEnd,
      map: new Map(),
    });
    salaryHolidayMap.forEach((_, key) => holidaySet.add(key));

    const monthHolidayMap = new Map(
      monthHolidayDocs.map((holiday) => [
        buildDayKey(new Date(holiday.date)),
        holiday.name || "Holiday",
      ]),
    );

    addAnnouncementHolidayDays({
      announcements: monthAnnouncementHolidays,
      rangeStart: monthStart,
      rangeEnd: monthEnd,
      map: monthHolidayMap,
    });

    const companyHolidaysThisMonth = Array.from(monthHolidayMap.entries())
      .map(([date, name]) => ({ date, name }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get Attendance Records
    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: salaryPeriodStart, $lte: today },
    });

    // Get Approved Leaves overlapping the salary period up to today
    const leaveDocs = await Leave.find({
      employeeId,
      status: "Approved",
      $or: [
        { startDate: { $gte: salaryPeriodStart, $lte: today } },
        { endDate: { $gte: salaryPeriodStart, $lte: today } },
        {
          startDate: { $lte: salaryPeriodStart },
          endDate: { $gte: salaryPeriodStart },
        },
      ],
    }).select("startDate endDate type");

    // Build a set of leave day keys that fall within salaryPeriodStart..today and are working days (not weekend, not company holiday)
    const leaveDaySet = new Set();
    leaveDocs.forEach((l) => {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);

      const from = s < salaryPeriodStart ? new Date(salaryPeriodStart) : s;
      const to = e > today ? new Date(today) : e;

      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dayKey = buildDayKey(new Date(d));
        const dayOfWeek = new Date(d).getDay();
        // exclude weekends
        if (dayOfWeek === 5 || dayOfWeek === 6) continue;
        // exclude company holidays
        if (holidaySet && holidaySet.has(dayKey)) continue;
        leaveDaySet.add(dayKey);
      }
    });

    // Metrics
    const attendanceDays = new Set();
    let presentDays = 0;
    let lateDays = 0;
    let totalLateMinutes = 0;
    let chargeableLateMinutes = 0;

    attendances.forEach((att) => {
      attendanceDays.add(buildDayKey(new Date(att.date)));

      if (att.status === "Present") {
        presentDays++;
      }

      if (att.status === "Late") {
        presentDays++;
        lateDays++;

        const rawLateMinutes = Number(att.lateDuration || 0);

        totalLateMinutes += rawLateMinutes;

        const deductibleMinutes = Math.max(
          0,
          rawLateMinutes - gracePeriodMinutes,
        );

        chargeableLateMinutes += deductibleMinutes;
      }
    });

    // Working Days Count
    // Total working days in the current month's salary period
    const totalWorkingDays = getWorkingDays(
      salaryPeriodStart,
      salaryPeriodEnd,
      holidaySet,
    );

    // Working days completed so far (from salary period start to today)
    const workingDaysSoFar = getWorkingDays(
      salaryPeriodStart,
      today,
      holidaySet,
    );

    const attendanceCount = attendanceDays.size;
    const leaveDaysCount = leaveDaySet.size;
    const absentDays = Math.max(
      0,
      workingDaysSoFar - attendanceCount - leaveDaysCount,
    );

    // Salary Calculations
    const dailyRate = totalWorkingDays > 0 ? baseSalary / totalWorkingDays : 0;

    const dailyWorkMinutes =
      Math.max(1, shiftEndTotalMinutes - shiftStartTotalMinutes) || 8 * 60;

    const perMinuteSalaryRate =
      dailyWorkMinutes > 0 ? dailyRate / dailyWorkMinutes : 0;

    const lateDeduction = chargeableLateMinutes * perMinuteSalaryRate;

    const absentDeduction = absentDays * dailyRate;

    const monthlySalaryCut = lateDeduction + absentDeduction;

    const predictedSalary = Math.max(0, baseSalary - monthlySalaryCut);

    const workingDaysRemaining = Math.max(
      0,
      totalWorkingDays - workingDaysSoFar,
    );
    const workingProgressPercent =
      totalWorkingDays > 0 ? (workingDaysSoFar / totalWorkingDays) * 100 : 0;

    // Salary is finalized only when the salary period is complete
    const isSalaryFinalized =
      today >= salaryPeriodEnd && workingDaysRemaining === 0;
    const finalSalary = isSalaryFinalized ? predictedSalary : null;

    // Response
    res.json({
      baseSalary,
      totalWorkingDays,
      workingDaysSoFar,
      workingDaysRemaining,
      workingProgressPercent: Number(workingProgressPercent.toFixed(2)),
      salaryPeriodStart: salaryPeriodStart.toISOString().split("T")[0],
      salaryPeriodEnd: salaryPeriodEnd.toISOString().split("T")[0],
      dailyWorkMinutes,
      perMinuteSalaryRate: perMinuteSalaryRate.toFixed(4),
      dailyRate: dailyRate.toFixed(2),
      gracePeriodMinutes,

      presentDays,
      absentDays,
      lateDays,

      totalLateMinutes,
      chargeableLateMinutes,
      companyHolidayCount: holidaySet.size,
      companyHolidayCountThisMonth: companyHolidaysThisMonth.length,
      companyHolidaysThisMonth,
      companyHolidayMonth: `${monthStart.getFullYear()}-${String(
        monthStart.getMonth() + 1,
      ).padStart(2, "0")}`,
      leaveDaysCount: leaveDaySet ? leaveDaySet.size : 0,
      leaveDates: leaveDaySet ? Array.from(leaveDaySet).sort() : [],

      lateDeduction: lateDeduction.toFixed(2),
      absentDeduction: absentDeduction.toFixed(2),

      monthlySalaryCut: monthlySalaryCut.toFixed(2),
      salaryCutSoFar: monthlySalaryCut.toFixed(2),

      predictedSalary: predictedSalary.toFixed(2),
      finalSalary: finalSalary !== null ? finalSalary.toFixed(2) : null,
      isSalaryFinalized,
      salaryStatus: isSalaryFinalized ? "final" : "predicted",

      currency: "৳",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = { predictSalary };
