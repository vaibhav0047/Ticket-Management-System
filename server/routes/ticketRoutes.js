const express = require("express");
const router = express.Router();

const {
    createTicket,
    getTickets,
    updateTicket
} = require("../controllers/ticketController");

const { protect } = require("../middleware/authMiddleware");

//  DEBUG SAFETY (remove later if you want)
if (typeof protect !== "function") {
    throw new Error("protect is NOT a function. Check its export.");
}

if (typeof createTicket !== "function") {
    throw new Error("createTicket is NOT a function. Check ticketController export.");
}

if (typeof getTickets !== "function") {
    throw new Error("getTickets is NOT a function. Check ticketController export.");
}

if (typeof updateTicket !== "function") {
    throw new Error("updateTicket is NOT a function. Check ticketController export.");
}

router.post("/create", createTicket);
router.get("/", getTickets);
router.patch("/:id", updateTicket);

module.exports = router;