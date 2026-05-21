const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["Company", "HR"],
      default: "Company",
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    holidayDate: {
      type: Date,
    },
    holidayStartDate: {
      type: Date,
    },
    holidayEndDate: {
      type: Date,
    },
    holidayName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const Announcement = mongoose.model("Announcement", announcementSchema);
module.exports = Announcement;
