const Comment = require("../models/Comment");
const ActivityLog = require("../models/ActivityLog");
const Ticket = require("../models/Ticket");
const Membership = require("../models/Membership");

/**
 * ADD COMMENT / INTERNAL NOTE
 */
exports.addComment = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, attachments = [], isInternal = false, orgId } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ message: "Comment message is required" });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const comment = await Comment.create({
            ticketId,
            senderId: req.user.id,
            message: message.trim(),
            attachments,
            isInternal,
        });

        // Record Activity Log
        await ActivityLog.create({
            ticketId,
            user: req.user.id,
            action: isInternal ? "Added an internal team note" : "Commented on ticket",
        });

        const populatedComment = await Comment.findById(comment._id).populate(
            "senderId",
            "name email avatar"
        );

        res.status(201).json({
            message: "Comment added successfully",
            comment: populatedComment,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET TICKET COMMENTS & ACTIVITY TIMELINE
 */
exports.getTicketComments = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const [comments, activities] = await Promise.all([
            Comment.find({ ticketId })
                .populate("senderId", "name email avatar")
                .sort({ createdAt: 1 }),
            ActivityLog.find({ ticketId })
                .populate("user", "name email avatar")
                .sort({ createdAt: 1 }),
        ]);

        res.json({
            comments,
            activities,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
