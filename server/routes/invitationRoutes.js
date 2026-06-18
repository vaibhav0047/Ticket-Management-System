const express = require("express");
const router = express.Router();

const {
    getInvitation,
    acceptInvitation
} = require("../controllers/invitationController");


const { protect } = require("../middleware/authMiddleware");


// view invitation
router.get(
    "/:token",
    getInvitation
);


// accept invitation
router.post(
    "/accept/:token",
    protect,
    acceptInvitation
);


module.exports = router;