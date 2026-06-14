const mongoose = require("mongoose");
console.log("User model file loaded");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["admin", "developer", "user"],
        default: "user"
    },

    department: {
        type: String,
        enum: [
            "Engineering",
            "Product",
            "Sales",
            "HR",
            "IT Support"
        ],
        default: "Engineering"
    }
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);