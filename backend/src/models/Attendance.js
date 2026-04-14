const mongoose = require("mongoose");
const { ATTENDANCE_STATUSES } = require("../utils/constants");

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: Date, required: true },
    dateKey: { type: String, required: true, index: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: "present" },
    lateMinutes: { type: Number, default: 0 },
    earlyExitMinutes: { type: Number, default: 0 },
    workedMinutes: { type: Number, default: 0 },
    source: { type: String, default: "self" },
    remarks: { type: String, default: "" },
    audit: {
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
