const Announcement = require("../models/Announcement");
const Holiday = require("../models/Holiday");
const User = require("../models/User");
const sendEmail = require("../utils/emailSender");

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

const syncHolidayDatesForAnnouncement = async (
  announcementId,
  title,
  content,
) => {
  await Holiday.deleteMany({ sourceAnnouncementId: announcementId });

  const holidayDates = extractHolidayDates(title, content);
  if (holidayDates.length === 0) {
    return [];
  }

  const docs = holidayDates.map((date) => ({
    title: `Company Holiday: ${date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    date,
    type: "Company",
    sourceAnnouncementId: announcementId,
    isRecurringAnnual: false,
    isActive: true,
  }));

  return Holiday.insertMany(docs, { ordered: false });
};

const escapeHtml = (s) => {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      createdBy: req.user._id,
    });

    const populatedAnnouncement = await announcement.populate(
      "createdBy",
      "name role",
    );

    /** Shown in API response so admins can see SMTP status without reading server logs only */
    await syncHolidayDatesForAnnouncement(announcement._id, title, content);
    let emailNotice = { sent: false, reason: "dispatch_not_run" };

    // Send announcement email to all active employees (non-blocking on errors)
    try {
      const employees = await User.find({
        role: "Employee",
        status: "Active",
      }).select("email name");
      const recipients = employees.map((e) => e.email).filter(Boolean);

      if (recipients.length === 0) {
        console.warn(
          "[announcement] Created but no active employees with emails; skipping notification mail.",
        );
        emailNotice = { sent: false, reason: "no_active_employee_emails" };
      } else {
        const seen = new Set();
        const uniqueRecipients = [];
        for (const e of recipients) {
          const trimmed = String(e).trim();
          if (!trimmed) continue;
          const key = trimmed.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          uniqueRecipients.push(trimmed);
        }
        const bccChunks = [];
        const chunkSize = Number(process.env.ANNOUNCEMENT_BCC_CHUNK_SIZE) || 45;
        for (let i = 0; i < uniqueRecipients.length; i += chunkSize) {
          bccChunks.push(uniqueRecipients.slice(i, i + chunkSize));
        }

        const subject = `[Announcement] ${title}`;
        const text = `${title}\n\n${content}\n\n— ${populatedAnnouncement.createdBy?.name || "Admin"}`;
        const safeTitle = escapeHtml(title);
        const safeContent = escapeHtml(content).replace(/\n/g, "<br>");
        const safeSigner = escapeHtml(
          populatedAnnouncement.createdBy?.name || "Admin",
        );
        const html = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                        <h2 style="margin: 0 0 12px;">${safeTitle}</h2>
                        <div style="color: #111;">${safeContent}</div>
                        <p style="margin-top: 16px; color: #555;">
                            — ${safeSigner}
                        </p>
                    </div>
                `;

        let allOk = true;
        let lastError = "";
        let lastHint = "";
        for (let c = 0; c < bccChunks.length; c += 1) {
          const result = await sendEmail({
            bcc: bccChunks[c],
            subject,
            message: text,
            html,
          });
          if (!result?.ok) {
            allOk = false;
            lastError = result?.error || "unknown error";
            lastHint = result?.hint || lastHint;
            console.error(
              `[announcement] Batch ${c + 1}/${bccChunks.length} failed (${bccChunks[c].length} recipients):`,
              lastError,
            );
          }
        }

        emailNotice = {
          sent: allOk,
          recipientCount: uniqueRecipients.length,
          batches: bccChunks.length,
          ...(allOk ? {} : { error: lastError, hint: lastHint }),
        };

        if (allOk) {
          console.log(
            `[announcement] Notification mail sent to ${uniqueRecipients.length} employee(s)` +
              (bccChunks.length > 1
                ? ` in ${bccChunks.length} batch(es).`
                : "."),
          );
        } else {
          console.error(
            "[announcement] One or more notification batches failed. Last error:",
            lastError,
          );
        }
      }
    } catch (emailErr) {
      console.error(
        "Announcement email dispatch failed:",
        emailErr?.message || emailErr,
      );
      emailNotice = {
        sent: false,
        error: emailErr?.message || String(emailErr),
      };
    }

    const payload =
      typeof populatedAnnouncement.toObject === "function"
        ? populatedAnnouncement.toObject()
        : populatedAnnouncement;
    res.status(201).json({ ...payload, emailNotice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (announcement) {
      await Holiday.deleteMany({ sourceAnnouncementId: announcement._id });
      await Announcement.deleteOne({ _id: announcement._id });
      res.json({ message: "Announcement removed" });
    } else {
      res.status(404).json({ message: "Announcement not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
const updateAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (announcement) {
      announcement.title = title || announcement.title;
      announcement.content = content || announcement.content;

      const updatedAnnouncement = await announcement.save();
      await syncHolidayDatesForAnnouncement(
        updatedAnnouncement._id,
        updatedAnnouncement.title,
        updatedAnnouncement.content,
      );
      const populatedAnnouncement = await updatedAnnouncement.populate(
        "createdBy",
        "name role",
      );
      res.json(populatedAnnouncement);
    } else {
      res.status(404).json({ message: "Announcement not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
