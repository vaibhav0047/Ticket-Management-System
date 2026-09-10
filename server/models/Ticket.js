const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        category: {
            type: String,
            default: "General",
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },

        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved"],
            default: "Open",
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true,
        },

        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        aiSummary: String,

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Ticket", ticketSchema);