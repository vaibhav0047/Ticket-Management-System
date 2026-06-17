const Ticket = require("../models/Ticket");

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
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET TICKETS
 */
exports.getTickets = async (req, res) => {
    try {
        const user = req.user;

        let tickets;

        if (user.role === "admin") {
            tickets = await Ticket.find().populate("createdBy", "name email");
        } else {
            tickets = await Ticket.find({ createdBy: user.id });
        }

        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * UPDATE TICKET
 */
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const { status, assignedTo } = req.body;

        if (status) ticket.status = status;
        if (assignedTo) ticket.assignedTo = assignedTo;

        await ticket.save();

        res.json({
            message: "Ticket updated successfully",
            ticket,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};