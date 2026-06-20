const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },


        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null
        },


        role: {
            type: String,

            enum: [
                "owner",
                "org_admin",
                "department_manager",
                "team_lead",
                "member",
                "viewer"
            ],

            default: "member"
        }

    },
    {
        timestamps: true
    });


module.exports = mongoose.model(
    "Membership",
    membershipSchema
);