const Organization = require("../models/Organization");
const Membership = require("../models/Membership");


exports.getInvitation = async (req, res) => {

    try {

        const org =
            await Organization.findOne({
                inviteToken: req.params.token
            })
                .populate("createdBy", "name email");


        if (!org) {

            return res.status(404).json({
                message: "Invalid invitation"
            });

        }


        res.json({

            orgId: {
                _id: org._id,
                name: org.name
            },

            role: "member"

        });


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};
exports.acceptInvitation = async (req, res) => {

    try {

        const org =
            await Organization.findOne({
                inviteToken: req.params.token
            });


        if (!org) {

            return res.status(404).json({
                message: "Invalid invitation"
            });

        }


        org.members = org.members || [];


        const exists =
            org.members.some(
                m =>
                    m.user &&
                    m.user.toString() === req.user.id.toString()
            );


        if (exists) {

            return res.status(400).json({
                message: "Already joined"
            });

        }



        // add in Organization members
        org.members.push({

            user: req.user.id,

            role: "member"

        });



        await org.save();



        // add in Membership collection (dashboard uses this)
        await Membership.create({

            userId: req.user.id,

            orgId: org._id,

            role: "user",

            departmentId: null

        });



        res.json({

            message: "Joined successfully"

        });



    } catch (error) {

        console.error("ACCEPT INVITE ERROR:", error);

        res.status(500).json({

            message: error.message

        });

    }

};