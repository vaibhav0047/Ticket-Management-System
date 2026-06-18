const mongoose = require("mongoose");


const OrganizationSchema = new mongoose.Schema({

    name: String,

    description: String,

    industry: String,

    companySize: String,

    website: String,


    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },


    members: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            role: {
                type: String,
                default: "member"
            }
        }
    ],


    inviteToken: String,

    inviteExpires: Date


}, {
    timestamps: true
});


module.exports =
    mongoose.model(
        "Organization",
        OrganizationSchema
    );