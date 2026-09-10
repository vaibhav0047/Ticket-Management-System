const Integration = require("../models/Integration");
const Membership = require("../models/Membership");
const dispatchWebhooks = require("../utils/dispatchWebhooks");

/**
 * GET ALL INTEGRATIONS FOR ORG
 */
exports.getIntegrations = async (req, res) => {
    try {
        const { orgId } = req.query;
        if (!orgId) {
            return res.status(400).json({ message: "Organization ID required" });
        }

        const integrations = await Integration.find({ orgId });
        res.json(integrations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * SAVE / UPDATE INTEGRATION CONNECTOR
 */
exports.saveIntegration = async (req, res) => {
    try {
        const { orgId, platform, webhookUrl, enabled = true, events } = req.body;

        if (!orgId || !platform || !webhookUrl) {
            return res.status(400).json({ message: "Organization ID, platform, and Webhook URL required" });
        }

        const membership = await Membership.findOne({ orgId, userId: req.user.id });
        if (!membership || !["owner", "org_admin"].includes(membership.role)) {
            return res.status(403).json({ message: "Only Organization Admins can manage third-party app connectors" });
        }

        const existing = await Integration.findOne({ orgId, platform });

        let integration;
        if (existing) {
            existing.webhookUrl = webhookUrl.trim();
            existing.enabled = enabled;
            if (events) existing.events = events;
            integration = await existing.save();
        } else {
            integration = await Integration.create({
                orgId,
                platform,
                webhookUrl: webhookUrl.trim(),
                enabled,
                events: events || ["ticket_created", "high_priority_alert", "status_updated", "sla_breached"]
            });
        }

        res.json({
            message: `${platform.toUpperCase()} integration saved successfully`,
            integration
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * SEND TEST TRIGGER TO WEBHOOK CONNECTOR
 */
exports.testIntegration = async (req, res) => {
    try {
        const { orgId, platform, webhookUrl } = req.body;

        if (!webhookUrl) {
            return res.status(400).json({ message: "Webhook URL is required" });
        }

        const dummyTicket = {
            _id: "6500a1b2c3d4e5f678901234",
            title: "Test Connection Payload from TMS Connector Hub",
            description: "This is a test automation trigger payload to verify third-party app integration.",
            priority: "High",
            status: "In Progress",
            department: "Engineering",
            createdBy: { name: req.user.name || "Admin User" },
            assignedTo: { name: "Lead Engineer" },
            createdAt: new Date().toISOString()
        };

        // Temporarily dispatch
        const tempIntegration = new Integration({
            orgId: orgId || "dummy",
            platform,
            webhookUrl,
            enabled: true,
            events: ["ticket_created"]
        });

        await dispatchWebhooks(orgId || "dummy", "ticket_created", dummyTicket, "🧪 Integration Test Connection Trigger");

        res.json({ message: `Test webhook dispatched to ${platform.toUpperCase()}!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
