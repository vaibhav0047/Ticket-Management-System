

const express = require("express");

const router = express.Router();

const {
    createOrganization,
    getOrganization,
    deleteOrganization,
    getMyOrganizations,
    getOrganizationMembers,
    createInvite,
    joinOrganization,
    updateMember,
    removeMember
} = require("../controllers/orgController");



const {
    protect,
} = require("../middleware/authMiddleware");


// Create organization
router.post(
    "/",
    protect,
    createOrganization
);
// Update member role/designation
router.put(
    "/members/:id",
    protect,
    updateMember
);
router.put("/members/:id", protect, (req, res) => {
    console.log("UPDATE ROUTE HIT");
    res.json({ success: true });
});

// Get logged in user's organizations
router.get(
    "/my",
    protect,
    getMyOrganizations
);


// Delete organization
router.delete(
    "/:id",
    protect,
    deleteOrganization
);

router.delete(
    "/members/:id",
    protect,
    removeMember
);

router.post(
    "/:id/invite",
    protect,
    createInvite
);

// Get single organization details
router.get(
    "/:id",
    protect,
    getOrganization
);


// Get organization members
router.get(
    "/:id/members",
    protect,
    getOrganizationMembers
);
router.post(
    "/accept/:token",
    protect,
    joinOrganization
);


module.exports = router;