const Announcement = require("../models/Announcement");
const Membership = require("../models/Membership");

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

        res.status(201).json({
            message: "Announcement broadcasted successfully",
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
