const Department = require("../models/Department");

const getDepartmentsByOrg = async (req, res) => {
    try {
        const departments = await Department.find({
            orgId: req.params.orgId
        });

        res.status(200).json(departments);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getDepartmentsByOrg
};