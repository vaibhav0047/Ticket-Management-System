const Announcement = require("../models/Announcement");
const Membership = require("../models/Membership");
const sendEmail = require("../utils/sendEmail");
const getClientUrl = require("../utils/getClientUrl");

/**
 * GET ACTIVE ANNOUNCEMENTS FOR ORG
 */
exports.getAnnouncements = async (req, res) => {
    try {
        const { orgId } = req.query;
        if (!orgId) {
            return res.status(400).json({ message: "Organization ID required" });
        }

        const announcements = await Announcement.find({ orgId, active: true })
            .populate("author", "name email")
            .sort({ createdAt: -1 });

        res.json(announcements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * CREATE BROADCAST ANNOUNCEMENT (Admins & Leads)
 */
exports.createAnnouncement = async (req, res) => {
    try {
        const { orgId, title, message, type = "info" } = req.body;

        if (!orgId || !title || !message) {
            return res.status(400).json({ message: "Organization ID, title, and message are required" });
        }

        const membership = await Membership.findOne({
            orgId,
            userId: req.user.id
        });

        if (!membership || !["owner", "org_admin", "department_manager", "team_lead"].includes(membership.role)) {
            return res.status(403).json({ message: "Only Admins and Department Leads can publish workspace announcements" });
        }

        const announcement = await Announcement.create({
            orgId,
            author: req.user.id,
            title: title.trim(),
            message: message.trim(),
            type,
            active: true
        });

        const populated = await Announcement.findById(announcement._id).populate("author", "name email");

        // Broadcast email alert to all active organization members
        const allMemberships = await Membership.find({ orgId }).populate("userId", "name email");
        const memberEmails = allMemberships.map((m) => m.userId?.email).filter(Boolean);

        const clientUrl = getClientUrl(req);
        const typeColor = type === "warning" ? "#d97706" : type === "critical" ? "#dc2626" : "#2563eb";
        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e2e8f0; border-radius:10px; padding:24px; background-color:#ffffff;">
            <div style="background-color:${typeColor}; color:#ffffff; padding:12px 18px; border-radius:8px; margin-bottom:18px;">
                <h3 style="margin:0; font-size:18px;">📢 System Broadcast Announcement</h3>
            </div>
            <h2 style="color:#1e293b; margin-top:0; font-size:20px;">${title.trim()}</h2>
            <p style="color:#475569; font-size:14px; line-height:1.6; white-space:pre-wrap;">${message.trim()}</p>
            <p style="color:#64748b; font-size:12px; margin-top:16px;">Published by: <strong>${populated.author?.name || "Workspace Admin"}</strong></p>
            <br/>
            <div style="text-align:center;">
                <a href="${clientUrl}/dashboard" style="display:inline-block; padding:10px 22px; background-color:${typeColor}; color:white; font-weight:bold; text-decoration:none; border-radius:6px; font-size:14px;">View in TMS Dashboard</a>
            </div>
        </div>
        `;

        for (const recipientEmail of memberEmails) {
            sendEmail(recipientEmail, `[TMS Broadcast] ${title.trim()}`, emailHtml).catch((err) =>
                console.error(`Broadcast email error for ${recipientEmail}:`, err)
            );
        }

        res.status(201).json({
            message: "Announcement broadcasted successfully and dispatched via email",
            announcement: populated
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * DEACTIVATE ANNOUNCEMENT
 */
exports.dismissAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        announcement.active = false;
        await announcement.save();

        res.json({ message: "Announcement dismissed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
