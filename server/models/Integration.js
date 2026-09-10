const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        platform: {
            type: String,
            enum: ["discord", "whatsapp", "salesforce", "custom_webhook"],
            required: true,
        },
        webhookUrl: {
            type: String,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        events: {
            type: [String],
            default: ["ticket_created", "high_priority_alert", "status_updated", "sla_breached"],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Integration", integrationSchema);
