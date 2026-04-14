const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], required: true },
    recipient: { type: String, required: true },
    payload: { type: Object, default: {} },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
