const OfficeSettings = require("../models/OfficeSettings");

async function getOfficeSettings() {
  let settings = await OfficeSettings.findOne({ key: "default" });

  if (!settings) {
    settings = await OfficeSettings.create({ key: "default" });
  }

  return settings;
}

module.exports = {
  getOfficeSettings,
};
