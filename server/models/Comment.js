const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        attachments: [
            {
                filename: String,
                fileData: String,
            }
        ],
        isInternal: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Comment", commentSchema);
