const express = require("express");
const router = express.Router();

const {
    getDepartmentsByOrg
} = require("../controllers/departmentController");

router.get(
    "/organization/:orgId",
    getDepartmentsByOrg
);

module.exports = router;