const Ticket = require("../models/Ticket");
console.log("Collection name:", Ticket.collection.name);
console.log("DB name:", Ticket.db.name);
exports.getDashboardStats = async (req, res) => {
    const total = await Ticket.countDocuments();

    const open = await Ticket.countDocuments({
        status: "Open",
    });

    const progress = await Ticket.countDocuments({
        status: "In Progress",
    });

    const resolved = await Ticket.countDocuments({
        status: "Resolved",
    });

    res.json({
        total,
        open,
        progress,
        resolved,
    });
};