const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { addComment, getTicketComments } = require("../controllers/commentController");

router.post("/:ticketId", protect, addComment);
router.get("/:ticketId", protect, getTicketComments);

module.exports = router;
