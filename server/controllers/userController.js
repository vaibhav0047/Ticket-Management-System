const Membership = require("../models/Membership");
const User = require("../models/User");

/**
 * GET USER PROFILE
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const memberships = await Membership.find({ userId: req.user.id })
            .populate("orgId", "name industry")
            .populate("departmentId", "name");

        res.json({
            user,
            memberships
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};

/**
 * UPDATE USER PROFILE
 */
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar, bio } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (avatar !== undefined) user.avatar = avatar;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        const updatedUser = await User.findById(req.user.id).select("-password");

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const members = await Membership.find({})
            .populate({
                path: "userId",
                select: "name email phone avatar bio"
            })
            .populate({
                path: "departmentId",
                select: "name"
            })
            .populate({
                path: "orgId",
                select: "name"
            });

        const users = members.map(member => ({
            _id: member.userId?._id,
            name: member.userId?.name,
            email: member.userId?.email,
            phone: member.userId?.phone,
            avatar: member.userId?.avatar,
            bio: member.userId?.bio,
            role: member.role,
            department: member.departmentId || null,
            organization: member.orgId
        }));

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role, department } = req.body;

        const member = await Membership.findOneAndUpdate(
            { userId: req.params.id },
            { role, departmentId: department },
            { new: true }
        );

        res.json(member);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};