const mongoose = require("mongoose");

const officeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    officeName: { type: String, default: "Attendify HQ" },
    workdays: { type: [Number], default: [1, 2, 3, 4, 5] },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "18:00" },
    gracePeriodMinutes: { type: Number, default: 10 },
    latePenaltyPerMinute: { type: Number, default: 1 },
    absenceDeductionPerDay: { type: Number, default: 500 },
    halfDayThresholdMinutes: { type: Number, default: 240 },
    senderLabel: { type: String, default: "Attendify" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OfficeSettings", officeSettingsSchema);
