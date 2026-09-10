const express = require("express");
const router = express.Router();
const {
    suggestPriorityAndDept,
    generateSolutionDraft,
    copilotQuery
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/suggest", protect, suggestPriorityAndDept);
router.post("/draft-solution", protect, generateSolutionDraft);
router.post("/copilot-query", protect, copilotQuery);

module.exports = router;
