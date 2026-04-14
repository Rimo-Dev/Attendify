const mongoose = require("mongoose");
const { LEAVE_STATUSES, LEAVE_TYPES } = require("../utils/constants");

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: LEAVE_STATUSES, default: "pending" },
    decisionNote: { type: String, default: "" },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approverRole: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
