const express = require("express");
const router = express.Router();

const {
    createOrganization,
    getOrganization,
    deleteOrganization,
    getMyOrganizations,
    getOrganizationMembers,
    createInvite,
    joinOrganization
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