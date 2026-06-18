const Organization = require("../models/Organization");
const Membership = require("../models/Membership");
const Department = require("../models/Department");
const Invitation = require("../models/Invitation");


const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");


const createOrganization = async (req, res) => {
    try {
        const {
            name,
            description,
            industry,
            companySize,
            website,
            departments = [],
            members = [],
        } = req.body;

        // Create Organization
        const org = await Organization.create({
            name,
            description,
            industry,
            companySize,
            website,
            createdBy: req.user.id,
        });

        // Create Creator Membership
        await Membership.create({
            userId: req.user.id,
            orgId: org._id,
            role: "admin",
            departmentId: null,
        });

        // Store created departments
        const departmentMap = {};

        for (const deptName of departments) {
            if (!deptName?.trim()) continue;

            const department = await Department.create({
                name: deptName.trim(),
                orgId: org._id,
            });

            departmentMap[deptName.trim()] = department._id;
        }

        // Create invitation records
        // Create invitation records + send emails
        for (const member of members) {

            if (!member.email?.trim()) continue;

            const token = crypto
                .randomBytes(32)
                .toString("hex");

            await Invitation.create({
                email: member.email.trim(),
                orgId: org._id,
                departmentId:
                    departmentMap[
                    member.department
                    ] || null,
                role: member.role || "user",
                token,
                status: "pending",
            });

            const inviteLink =
                `${process.env.CLIENT_URL}/invite/${token}`;

            await sendEmail(
                member.email,

                `Invitation to join ${org.name}`,

                `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">

            <h2 style="color:#2563eb;">
                You're Invited 🎉
            </h2>

            <p>
                You have been invited to join
                <strong>${org.name}</strong>
                on the Ticket Management Portal.
            </p>

            <p>
                <strong>Role:</strong>
                ${member.role || "agent"}
            </p>

            <p>
                <strong>Department:</strong>
                ${member.department || "General"}
            </p>

            <br/>

            <a
                href="${inviteLink}"
                style="
                    display:inline-block;
                    background:#2563eb;
                    color:white;
                    padding:12px 24px;
                    border-radius:8px;
                    text-decoration:none;
                    font-weight:bold;
                "
            >
                Accept Invitation
            </a>

            <br/><br/>

            <p style="color:#666;">
                If you weren't expecting this invitation,
                you can safely ignore this email.
            </p>

        </div>
        `
            );
        }

        res.status(201).json({
            success: true,
            message:
                "Organization created successfully",
            organization: org,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyOrganizations = async (req, res) => {
    try {
        const memberships =
            await Membership.find({
                userId: req.user.id,
            }).populate("orgId");

        const orgs = memberships
            .filter((m) => m.orgId)
            .map((m) => ({
                _id: m.orgId._id,
                name: m.orgId.name,
                role: m.role,
            }));

        res.json(orgs);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message,
        });
    }
};
const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        res.json(organization);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};
const getOrganizationMembers = async (req, res) => {
    try {

        const members = await Membership.find({
            orgId: req.params.id
        })
            .populate({
                path: "userId",
                select: "name email"
            })
            .populate({
                path: "departmentId",
                select: "name"
            });


        const formattedMembers = members.map((member) => ({
            _id: member._id,

            user: member.userId,

            department: member.departmentId,

            role: member.role
        }));


        res.json({
            members: formattedMembers
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};
const deleteOrganization = async (req, res) => {
    try {

        const org = await Organization.findById(req.params.id);

        if (!org) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }


        await Organization.findByIdAndDelete(req.params.id);


        res.status(200).json({
            message: "Organization deleted successfully"
        });


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};
const createInvite = async (req, res) => {

    try {

        const organization = await Organization.findById(
            req.params.id
        );


        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }


        // generate unique secure token
        const token = crypto
            .randomBytes(32)
            .toString("hex");



        organization.inviteToken = token;


        // expire after 7 days
        organization.inviteExpires =
            Date.now() + 7 * 24 * 60 * 60 * 1000;



        await organization.save();



        const link =
            `${process.env.FRONTEND_URL}/invite/${token}`;



        res.status(200).json({
            link
        });



    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};
const joinOrganization = async (req, res) => {

    try {

        const organization =
            await Organization.findOne({
                inviteToken: req.params.token,
                inviteExpires: {
                    $gt: Date.now()
                }
            });


        if (!organization) {
            return res.status(400).json({
                message: "Invalid or expired invite link"
            });
        }



        const alreadyMember =
            organization.members.some(
                member =>
                    member.user.toString() === req.user._id.toString()
            );


        if (alreadyMember) {

            return res.status(400).json({
                message: "Already a member"
            });

        }



        organization.members.push({

            user: req.user._id,

            role: "member"

        });



        await organization.save();



        res.json({

            message: "Joined organization successfully",

            organizationId: organization._id

        });



    } catch (error) {

        res.status(500).json({
            message: error.message
        })

    }

}
module.exports = {
    createOrganization,
    getMyOrganizations,
    getOrganization,
    getOrganizationMembers,
    deleteOrganization,
    createInvite,
    joinOrganization
};