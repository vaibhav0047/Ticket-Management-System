const express = require("express");
const router = express.Router();
const {
    getIntegrations,
    saveIntegration,
    testIntegration
} = require("../controllers/integrationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getIntegrations);
router.post("/", protect, saveIntegration);
router.post("/test", protect, testIntegration);

module.exports = router;
