const { body } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const { getOfficeSettings } = require("../services/officeSettingsService");

const officeSettingsValidators = [
  body("officeName").optional().notEmpty(),
  body("workdays").optional().isArray(),
  body("startTime").optional().matches(/^\d{2}:\d{2}$/),
  body("endTime").optional().matches(/^\d{2}:\d{2}$/),
];

const getOfficeSettingsController = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "Office settings fetched successfully.", await getOfficeSettings())
);

const updateOfficeSettings = asyncHandler(async (req, res) => {
  const settings = await getOfficeSettings();
  ["officeName", "workdays", "startTime", "endTime", "gracePeriodMinutes", "latePenaltyPerMinute", "absenceDeductionPerDay", "halfDayThresholdMinutes", "senderLabel"].forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  await settings.save();
  return sendResponse(res, 200, "Office settings updated successfully.", settings);
});

module.exports = {
  officeSettingsValidators,
  getOfficeSettingsController,
  updateOfficeSettings,
};
