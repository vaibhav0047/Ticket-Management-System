const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
    getUsers,
    updateUserRole
} = require("../controllers/userController");

router.get("/", protect, getUsers);
router.put("/:id", protect, updateUserRole);

module.exports = router;