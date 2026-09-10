const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
    getUsers,
    updateUserRole,
    getProfile,
    updateProfile
} = require("../controllers/userController");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

router.get("/", protect, getUsers);
router.put("/:id", protect, updateUserRole);

module.exports = router;