const Announcement = require("../models/Announcement");
const Holiday = require("../models/Holiday");
const User = require("../models/User");
const sendEmail = require("../utils/emailSender");

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
// @access  Private/Admin or HR (with restrictions)
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      isHoliday,
      holidayDate,
      holidayStartDate,
      holidayEndDate,
      holidayName,
    } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    // normalize holiday date(s) if provided
    let normalizedHolidayDate = null;
    let normalizedHolidayStart = null;
    let normalizedHolidayEnd = null;

    if (isHoliday) {
      try {
        if (holidayStartDate) {
          normalizedHolidayStart = new Date(holidayStartDate);
          normalizedHolidayStart.setHours(0, 0, 0, 0);
        }
        if (holidayEndDate) {
          normalizedHolidayEnd = new Date(holidayEndDate);
          normalizedHolidayEnd.setHours(0, 0, 0, 0);
        }
        if (!normalizedHolidayStart && holidayDate) {
          normalizedHolidayDate = new Date(holidayDate);
          normalizedHolidayDate.setHours(0, 0, 0, 0);
        }

        // Allow one-day holidays when only one endpoint is provided.
        if (normalizedHolidayStart && !normalizedHolidayEnd) {
          normalizedHolidayEnd = new Date(normalizedHolidayStart);
        }
        if (!normalizedHolidayStart && normalizedHolidayEnd) {
          normalizedHolidayStart = new Date(normalizedHolidayEnd);
        }
      } catch (e) {
        normalizedHolidayDate =
          normalizedHolidayStart =
          normalizedHolidayEnd =
            null;
      }
    }

    const announcement = await Announcement.create({
      title,
      content,
      category: category || (req.user.role === "HR" ? "HR" : "Company"),
      createdBy: req.user._id,
      isHoliday: !!isHoliday,
      holidayDate: normalizedHolidayDate,
      holidayStartDate: normalizedHolidayStart,
      holidayEndDate: normalizedHolidayEnd,
      holidayName: holidayName || (isHoliday ? title : undefined),
    });

    const populatedAnnouncement = await announcement.populate(
      "createdBy",
      "name role",
    );

    /** Shown in API response so admins can see SMTP status without reading server logs only */
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

    // If this announcement represents a holiday, ensure Holiday documents exist for each date in the range
    if (announcement.isHoliday) {
      try {
        // Determine range: prefer explicit start/end, fallback to single holidayDate
        let start =
          announcement.holidayStartDate || announcement.holidayDate || null;
        let end =
          announcement.holidayEndDate || announcement.holidayDate || null;

        if (start && end) {
          // Ensure Date objects
          start = new Date(start);
          end = new Date(end);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          // Swap if out-of-order
          if (start > end) {
            const tmp = start;
            start = end;
            end = tmp;
          }

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const day = new Date(d);
            day.setHours(0, 0, 0, 0);
            try {
              await Holiday.findOneAndUpdate(
                { date: day },
                {
                  name: announcement.holidayName || announcement.title,
                  date: day,
                  description: announcement.content || "",
                  sourceAnnouncement: announcement._id,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
              );
            } catch (innerErr) {
              console.error(
                "Failed to upsert holiday for date",
                day,
                innerErr?.message || innerErr,
              );
            }
          }
        }
      } catch (holErr) {
        console.error(
          "Failed to create linked Holiday(s) for announcement:",
          holErr?.message || holErr,
        );
      }
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
      // If this announcement created a holiday, remove that holiday entry
      try {
        await Holiday.deleteMany({ sourceAnnouncement: announcement._id });
      } catch (holDelErr) {
        console.error(
          "Failed to delete linked Holiday(s):",
          holDelErr?.message || holDelErr,
        );
      }

      await Announcement.deleteOne({ _id: announcement._id });
      res.json({ message: "Announcement removed" });
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
  deleteAnnouncement,
};
