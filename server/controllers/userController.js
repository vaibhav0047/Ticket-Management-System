const Membership = require("../models/Membership");


exports.getUsers = async (req, res) => {

    try {

        const members = await Membership.find({})
            .populate({
                path: "userId",
                select: "name email"
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


        const member =
            await Membership.findOneAndUpdate(

                {
                    userId: req.params.id
                },


                {
                    role,
                    departmentId: department
                },


                {
                    new: true
                }

            );


        res.json(member);



    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};