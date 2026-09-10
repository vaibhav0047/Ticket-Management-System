const express = require("express");
const router = express.Router();

const {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    getTicketStats,
    getTicketStatus,
    getTicketTrends,
    exportTicketsCSV
} = require("../controllers/ticketController");

const { protect } = require("../middleware/authMiddleware");

// Route definitions
router.post("/create", protect, createTicket);
router.get("/stats", protect, getTicketStats);
router.get("/status", protect, getTicketStatus);
router.get("/trends", protect, getTicketTrends);
router.get("/export/csv", protect, exportTicketsCSV);
router.get("/", protect, getTickets);
router.get("/:id", protect, getTicketById);
router.put("/:id", protect, updateTicket);
router.patch("/:id", protect, updateTicket);

module.exports = router;