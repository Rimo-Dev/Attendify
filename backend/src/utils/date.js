const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");

dayjs.extend(isoWeek);

function getDayBounds(date = new Date()) {
  return {
    start: dayjs(date).startOf("day").toDate(),
    end: dayjs(date).endOf("day").toDate(),
  };
}

function getMonthBounds(monthString) {
  const base = monthString ? dayjs(`${monthString}-01`) : dayjs();
  return {
    start: base.startOf("month").toDate(),
    end: base.endOf("month").toDate(),
  };
}

function getDateKey(date = new Date()) {
  return dayjs(date).format("YYYY-MM-DD");
}

function minutesBetween(startDate, endDate) {
  return Math.max(dayjs(endDate).diff(dayjs(startDate), "minute"), 0);
}

function combineDateAndTime(date, time) {
  const dateKey = dayjs(date).format("YYYY-MM-DD");
  return dayjs(`${dateKey}T${time}`).toDate();
}

function getWeekRange(date = new Date()) {
  return {
    start: dayjs(date).startOf("isoWeek").toDate(),
    end: dayjs(date).endOf("isoWeek").toDate(),
  };
}

module.exports = {
  dayjs,
  getDayBounds,
  getMonthBounds,
  getDateKey,
  minutesBetween,
  combineDateAndTime,
  getWeekRange,
};
