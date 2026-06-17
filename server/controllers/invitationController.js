const Invitation = require("../models/Invitation");
const Membership = require("../models/Membership");

const getInvitation = async (req, res) => {
    try {
        const invitation = await Invitation
            .findOne({
                token: req.params.token,
                status: "pending",
            })
            .populate("orgId");

        if (!invitation) {
            return res.status(404).json({
                message: "Invalid invitation",
            });
        }

        res.json(invitation);

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const acceptInvitation = async (req, res) => {
    try {

        const invitation = await Invitation.findOne({
            token: req.params.token,
            status: "pending",
        });

        if (!invitation) {
            return res.status(404).json({
                message: "Invalid invitation",
            });
        }

        const existingMembership =
            await Membership.findOne({
                userId: req.user.id,
                orgId: invitation.orgId,
            });

        if (existingMembership) {
            return res.status(400).json({
                message:
                    "You are already a member of this organization",
            });
        }

        await Membership.create({
            userId: req.user.id,
            orgId: invitation.orgId,
            role: invitation.role,
            departmentId:
                invitation.departmentId || null,
        });

        invitation.status = "accepted";
        await invitation.save();

        res.json({
            success: true,
            message:
                "Successfully joined organization",
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    getInvitation,
    acceptInvitation,
};