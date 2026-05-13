const Announcement = require('../models/Announcement');
const User = require('../models/User');
const sendEmail = require('../utils/emailSender');

const escapeHtml = (s) => {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name role')
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
            createdBy: req.user._id
        });

        const populatedAnnouncement = await announcement.populate('createdBy', 'name role');

        /** Shown in API response so admins can see SMTP status without reading server logs only */
        let emailNotice = { sent: false, reason: 'dispatch_not_run' };

        // Send announcement email to all active employees (non-blocking on errors)
        try {
            const employees = await User.find({ role: 'Employee', status: 'Active' }).select('email name');
            const recipients = employees.map(e => e.email).filter(Boolean);

            if (recipients.length === 0) {
                console.warn('[announcement] Created but no active employees with emails; skipping notification mail.');
                emailNotice = { sent: false, reason: 'no_active_employee_emails' };
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
                const text = `${title}\n\n${content}\n\n— ${populatedAnnouncement.createdBy?.name || 'Admin'}`;
                const safeTitle = escapeHtml(title);
                const safeContent = escapeHtml(content).replace(/\n/g, '<br>');
                const safeSigner = escapeHtml(populatedAnnouncement.createdBy?.name || 'Admin');
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
                let lastError = '';
                let lastHint = '';
                for (let c = 0; c < bccChunks.length; c += 1) {
                    const result = await sendEmail({
                        bcc: bccChunks[c],
                        subject,
                        message: text,
                        html,
                    });
                    if (!result?.ok) {
                        allOk = false;
                        lastError = result?.error || 'unknown error';
                        lastHint = result?.hint || lastHint;
                        console.error(
                            `[announcement] Batch ${c + 1}/${bccChunks.length} failed (${bccChunks[c].length} recipients):`,
                            lastError
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
                            (bccChunks.length > 1 ? ` in ${bccChunks.length} batch(es).` : '.')
                    );
                } else {
                    console.error('[announcement] One or more notification batches failed. Last error:', lastError);
                }
            }
        } catch (emailErr) {
            console.error('Announcement email dispatch failed:', emailErr?.message || emailErr);
            emailNotice = { sent: false, error: emailErr?.message || String(emailErr) };
        }

        const payload =
            typeof populatedAnnouncement.toObject === 'function'
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
            await Announcement.deleteOne({ _id: announcement._id });
            res.json({ message: 'Announcement removed' });
        } else {
            res.status(404).json({ message: 'Announcement not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement
};
