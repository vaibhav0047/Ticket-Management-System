const User = require("../models/User");

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role, department } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, department },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update user" });
    }
};