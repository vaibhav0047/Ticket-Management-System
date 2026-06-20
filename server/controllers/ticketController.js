const Ticket = require("../models/Ticket");
const Membership = require("../models/Membership");


/**
 * CREATE TICKET
 */
exports.createTicket = async (req, res) => {

    try {

        const { title, description, priority, department } = req.body;


        const ticket = await Ticket.create({

            title,
            description,
            priority,
            department,
            createdBy: req.user.id,
        });
        res.status(201).json({

            message: "Ticket created successfully",

            ticket,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
/**
 * GET TICKETS
 */
exports.getTickets = async (req, res) => {
    try {
        const membership = await Membership.findOne({

            userId: req.user.id,

            orgId: req.params.orgId
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not part of organization"
            });

        }
        let tickets;
        // Jira style permission

        if (
            [
                "owner",
                "org_admin",
                "department_manager",
                "team_lead"
            ].includes(membership.role)

        ) {

            tickets = await Ticket.find()

                .populate(
                    "createdBy",
                    "name email"
                );
        }

        else {
            tickets = await Ticket.find({

                createdBy: req.user.id

            });

        }

        res.json(tickets);

    }
    catch (err) {
        res.status(500).json({

            message: err.message

        });
    }
};

/**
 * UPDATE TICKET
 */
exports.updateTicket = async (req, res) => {


    try {
        const membership = await Membership.findOne({

            userId: req.user.id,

            orgId: req.params.orgId

        });

        if (!membership) {

            return res.status(403).json({

                message: "No access"
            });
        }
        if (
            ![
                "owner",
                "org_admin",
                "department_manager",
                "team_lead"
            ].includes(membership.role)

        ) {
            return res.status(403).json({
                message: "Permission denied"

            });

        }

        const { id } = req.params;



        const ticket = await Ticket.findById(id);

        if (!ticket) {

            return res.status(404).json({

                message: "Ticket not found"

            });

        }

        const { status, assignedTo } = req.body;

        if (status)

            ticket.status = status;

        if (assignedTo)
            ticket.assignedTo = assignedTo;
        await ticket.save();
        res.json({
            message: "Ticket updated successfully",

            ticket

        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};