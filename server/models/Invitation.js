const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
        },

        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
        },

        role: {
            type: String,
            enum: [
                "admin",
                "lead",
                "user"
            ],
            default: "user"
        },

        token: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
            ],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Invitation",
    invitationSchema
);