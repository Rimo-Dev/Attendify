const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    sourceAnnouncement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
      required: false,
    },
  },
  { timestamps: true },
);

const Holiday = mongoose.model("Holiday", holidaySchema);

module.exports = Holiday;
