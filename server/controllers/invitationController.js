const Organization = require("../models/Organization");
const Membership = require("../models/Membership");
const Department = require("../models/Department");


exports.getInvitation = async (req, res) => {

    try {

        const org = await Organization.findOne({
            inviteToken: req.params.token
        });


        if (!org) {

            return res.status(404).json({
                message: "Invalid invitation"
            });

        }



        const departments = await Department.find({
            orgId: org._id
        });


        res.json({

            orgId: {
                _id: org._id,
                name: org.name
            },

            role: "member",

            departments

        });


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};





exports.acceptInvitation = async (req, res) => {

    try {


        const { departmentId, role } = req.body;


        const org = await Organization.findOne({
            inviteToken: req.params.token
        });



        if (!org) {

            return res.status(404).json({
                message: "Invalid invitation"
            });

        }




        const exists = await Membership.findOne({

            userId: req.user.id,

            orgId: org._id

        });



        if (exists) {

            return res.status(400).json({
                message: "Already joined"
            });

        }





        await Membership.create({

            userId: req.user.id,

            orgId: org._id,

            departmentId: departmentId || null,

            role: role || "member"

        });





        res.json({

            message: "Joined successfully"

        });



    } catch (error) {


        console.error(error);


        res.status(500).json({

            message: error.message

        });


    }

};