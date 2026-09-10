// Helper for making web requests using native fetch or fallback
const sendPost = async (url, data) => {
    try {
        if (typeof fetch !== "undefined") {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
        } else {
            const axios = require("axios");
            await axios.post(url, data);
        }
    } catch (err) {
        console.error(`[WEBHOOK ERROR] ${url}:`, err.message);
    }
};

const Integration = require("../models/Integration");

/**
 * DISPATCH THIRD-PARTY APP WEBHOOKS (Discord, WhatsApp, Salesforce, Custom Webhooks)
 */
const dispatchWebhooks = async (orgId, eventType, ticket, eventTitle = "") => {
    try {
        if (!orgId || !ticket) return;

        const integrations = await Integration.find({
            orgId,
            enabled: true,
            events: eventType
        });

        if (integrations.length === 0) return;

        const ticketKey = `TKT-${ticket._id.toString().slice(-5).toUpperCase()}`;
        const deptName = ticket.department?.name || ticket.department || "General";
        const reporterName = ticket.createdBy?.name || "User";
        const assigneeName = ticket.assignedTo?.name || "Unassigned Lead";
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

        for (const integration of integrations) {
            const webhookUrl = integration.webhookUrl;
            if (!webhookUrl) continue;

            if (integration.platform === "discord") {
                // Format Discord Rich Embed Payload
                const embedColor = ticket.priority === "High" ? 15158332 : ticket.priority === "Medium" ? 16753920 : 3447003;
                const discordPayload = {
                    username: "TMS Ticket System Bot",
                    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=TMSBot",
                    embeds: [
                        {
                            title: `⚡ [TMS Alert] ${eventTitle || "Ticket Event"}: ${ticketKey}`,
                            description: `**Title:** ${ticket.title}\n**Description:** ${ticket.description || "No description"}`,
                            url: `${clientUrl}/ticket/${ticket._id}`,
                            color: embedColor,
                            fields: [
                                { name: "Priority", value: ticket.priority || "Medium", inline: true },
                                { name: "Department", value: deptName, inline: true },
                                { name: "Status", value: ticket.status || "Open", inline: true },
                                { name: "Reporter", value: reporterName, inline: true },
                                { name: "Assignee", value: assigneeName, inline: true }
                            ],
                            footer: {
                                text: `TMS Integration Hub • ${new Date().toLocaleString()}`
                            }
                        }
                    ]
                };

                sendPost(webhookUrl, discordPayload);
            } else {
                // Format Standard JSON Payload for WhatsApp (Twilio/WATI), Salesforce CRM, or Custom Webhooks
                const jsonPayload = {
                    event: eventType,
                    eventTitle: eventTitle || "TMS Ticket Event",
                    platform: integration.platform,
                    ticket: {
                        id: ticket._id,
                        key: ticketKey,
                        title: ticket.title,
                        description: ticket.description,
                        priority: ticket.priority,
                        status: ticket.status,
                        department: deptName,
                        reporter: reporterName,
                        assignee: assigneeName,
                        link: `${clientUrl}/ticket/${ticket._id}`,
                        createdAt: ticket.createdAt
                    },
                    timestamp: new Date().toISOString()
                };

                sendPost(webhookUrl, jsonPayload);
            }
        }
    } catch (err) {
        console.error("Failed to execute dispatchWebhooks:", err);
    }
};

module.exports = dispatchWebhooks;
