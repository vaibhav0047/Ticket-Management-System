const express = require("express");
const router = express.Router();
const {
    getAnnouncements,
    createAnnouncement,
    dismissAnnouncement
} = require("../controllers/announcementController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAnnouncements);
router.post("/", protect, createAnnouncement);
router.put("/:id/dismiss", protect, dismissAnnouncement);

module.exports = router;
