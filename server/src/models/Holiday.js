const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["Government", "Eid", "Company", "Other"],
      default: "Other",
    },
    sourceAnnouncementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
      default: null,
    },
    isRecurringAnnual: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

holidaySchema.index({ date: 1, isActive: 1 });
holidaySchema.index({ sourceAnnouncementId: 1, date: 1 }, { unique: false });

const Holiday = mongoose.model("Holiday", holidaySchema);
module.exports = Holiday;
