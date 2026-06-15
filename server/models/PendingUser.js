const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,

    otp: String,

    otpExpiry: Date
}, {
    timestamps: true
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);