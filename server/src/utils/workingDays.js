const Holiday = require("../models/Holiday");
const Announcement = require("../models/Announcement");

const toDateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MONTH_LOOKUP = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const normalizeText = (value) =>
  String(value || "").replace(/[\u2013\u2014]/g, "-");

const containsHolidayKeywords = (title, content) =>
  /\b(holiday|company\s+holiday|office\s+closed|closed|off\s+day|company\s+off)\b/i.test(
    `${title || ""} ${content || ""}`,
  );

const buildCalendarDate = (dayText, monthText, yearText, fallbackYear) => {
  const day = Number(dayText);
  const month = MONTH_LOOKUP[String(monthText || "").toLowerCase()];
  const year = Number(yearText || fallbackYear);

  if (
    !Number.isInteger(day) ||
    month === undefined ||
    !Number.isInteger(year)
  ) {
    return null;
  }

  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const expandDateRange = (startDate, endDate) => {
  const dates = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const current = new Date(cursor);
    current.setHours(0, 0, 0, 0);
    dates.push(current);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const extractHolidayDates = (title, content) => {
  if (!containsHolidayKeywords(title, content)) {
    return [];
  }

  const text = normalizeText(`${title || ""} ${content || ""}`);
  const referenceYear = new Date().getFullYear();

  const namedMonthPatterns = [
    /(?:from\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?\s*(?:-|to)\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i,
    /(?:from\s+)?([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\s*(?:-|to)\s*([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i,
  ];

  for (const pattern of namedMonthPatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const startDate =
      pattern === namedMonthPatterns[0]
        ? buildCalendarDate(match[1], match[2], match[3], referenceYear)
        : buildCalendarDate(match[2], match[1], match[3], referenceYear);
    const endDate =
      pattern === namedMonthPatterns[0]
        ? buildCalendarDate(
            match[4],
            match[5],
            match[6] || match[3],
            referenceYear,
          )
        : buildCalendarDate(
            match[5],
            match[4],
            match[6] || match[3],
            referenceYear,
          );

    if (startDate && endDate && endDate >= startDate) {
      return expandDateRange(startDate, endDate);
    }
  }

  const singleNamedMonthPatterns = [
    /(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i,
    /(?:on\s+)?([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i,
  ];

  for (const pattern of singleNamedMonthPatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const singleDate =
      pattern === singleNamedMonthPatterns[0]
        ? buildCalendarDate(match[1], match[2], match[3], referenceYear)
        : buildCalendarDate(match[2], match[1], match[3], referenceYear);

    if (singleDate) {
      return [singleDate];
    }
  }

  const singleNumericPattern =
    /(?:on\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/i;
  const singleNumericMatch = text.match(singleNumericPattern);
  if (singleNumericMatch) {
    const day = Number(singleNumericMatch[1]);
    const month = Number(singleNumericMatch[2]) - 1;
    const year = Number(singleNumericMatch[3] || referenceYear);

    if (
      Number.isInteger(day) &&
      Number.isInteger(month) &&
      Number.isInteger(year)
    ) {
      const singleDate = new Date(year, month, day);
      if (!Number.isNaN(singleDate.getTime())) {
        singleDate.setHours(0, 0, 0, 0);
        return [singleDate];
      }
    }
  }

  const numericPattern =
    /(?:from\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s*(?:-|to)\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/i;
  const numericMatch = text.match(numericPattern);
  if (!numericMatch) {
    return [];
  }

  const startDay = Number(numericMatch[1]);
  const startMonth = Number(numericMatch[2]) - 1;
  const startYear = Number(numericMatch[3] || referenceYear);
  const endDay = Number(numericMatch[4]);
  const endMonth = Number(numericMatch[5]) - 1;
  const endYear = Number(numericMatch[6] || numericMatch[3] || referenceYear);

  if (
    !Number.isInteger(startDay) ||
    !Number.isInteger(startMonth) ||
    !Number.isInteger(startYear) ||
    !Number.isInteger(endDay) ||
    !Number.isInteger(endMonth) ||
    !Number.isInteger(endYear)
  ) {
    return [];
  }

  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(endYear, endMonth, endDay);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return [];
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return expandDateRange(startDate, endDate);
};

const getMonthStart = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthEnd = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getHolidaySetForMonth = async (firstDay, lastDay) => {
  const holidaySet = new Set();

  const monthHolidays = await Holiday.find({
    isActive: true,
    $or: [
      { date: { $gte: firstDay, $lte: lastDay } },
      { isRecurringAnnual: true },
    ],
  }).select("date isRecurringAnnual");

  for (const holiday of monthHolidays) {
    const holidayDate = toDateOnly(holiday.date);

    if (
      holiday.isRecurringAnnual &&
      holidayDate.getMonth() !== firstDay.getMonth()
    ) {
      continue;
    }

    if (
      holiday.isRecurringAnnual &&
      holidayDate.getMonth() === firstDay.getMonth()
    ) {
      const recurringDate = new Date(
        firstDay.getFullYear(),
        holidayDate.getMonth(),
        holidayDate.getDate(),
      );
      holidaySet.add(formatDateKey(recurringDate));
      continue;
    }

    holidaySet.add(formatDateKey(holidayDate));
  }

  const holidayAnnouncements = await Announcement.find({
    createdAt: { $lte: lastDay },
  }).select("title content createdAt");

  for (const announcement of holidayAnnouncements) {
    const dates = extractHolidayDates(announcement.title, announcement.content);

    for (const date of dates) {
      if (date >= firstDay && date <= lastDay) {
        holidaySet.add(formatDateKey(date));
      }
    }
  }

  return holidaySet;
};

const isWorkingDay = (date, holidaySet) => {
  const day = date.getDay();

  // Weekly weekend: Friday (5) and Saturday (6)
  if (day === 5 || day === 6) {
    return false;
  }

  return !holidaySet.has(formatDateKey(date));
};

const countWorkingDays = (startDate, endDate, holidaySet) => {
  if (endDate < startDate) {
    return 0;
  }

  let workingDays = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const current = toDateOnly(cursor);
    if (isWorkingDay(current, holidaySet)) {
      workingDays++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return workingDays;
};

module.exports = {
  toDateOnly,
  formatDateKey,
  getMonthStart,
  getMonthEnd,
  getHolidaySetForMonth,
  isWorkingDay,
  countWorkingDays,
};
