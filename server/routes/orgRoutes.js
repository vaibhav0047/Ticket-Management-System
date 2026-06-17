const express = require("express");

const router = express.Router();

const {
    createOrganization,
    getMyOrganizations,
} = require("../controllers/orgController");

const {
    protect,
} = require("../middleware/authMiddleware");

router.post(
    "/",
    protect,
    createOrganization
);

router.get(
    "/my",
    protect,
    getMyOrganizations
);

module.exports = router;