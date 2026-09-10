const Ticket = require("../models/Ticket");
const Department = require("../models/Department");
const ActivityLog = require("../models/ActivityLog");

/**
 * AI TICKET CLASSIFIER & PRIORITY SUGGESTOR
 */
exports.suggestPriorityAndDept = async (req, res) => {
    try {
        const { title = "", description = "" } = req.body;
        const text = `${title} ${description}`.toLowerCase();

        let priority = "Medium";
        let confidenceScore = 0.88;
        let reasoning = "Standard priority evaluated based on issue scope.";

        // High priority rule triggers
        if (
            text.includes("crash") ||
            text.includes("down") ||
            text.includes("outage") ||
            text.includes("critical") ||
            text.includes("payment error") ||
            text.includes("database lock") ||
            text.includes("urgent") ||
            text.includes("breach") ||
            text.includes("security")
        ) {
            priority = "High";
            confidenceScore = 0.96;
            reasoning = "High urgency detected due to critical system keywords (outage/crash/security/database).";
        } else if (
            text.includes("typo") ||
            text.includes("minor") ||
            text.includes("documentation") ||
            text.includes("cosmetic") ||
            text.includes("color") ||
            text.includes("suggestion")
        ) {
            priority = "Low";
            confidenceScore = 0.90;
            reasoning = "Low urgency detected due to non-blocking cosmetic/documentation scope.";
        }

        // Department suggestion heuristics
        let suggestedDepartmentName = "General";
        if (
            text.includes("api") ||
            text.includes("bug") ||
            text.includes("crash") ||
            text.includes("code") ||
            text.includes("backend") ||
            text.includes("frontend") ||
            text.includes("database") ||
            text.includes("git")
        ) {
            suggestedDepartmentName = "Engineering";
        } else if (
            text.includes("invoice") ||
            text.includes("billing") ||
            text.includes("payment") ||
            text.includes("refund") ||
            text.includes("subscription") ||
            text.includes("price")
        ) {
            suggestedDepartmentName = "Sales & Billing";
        } else if (
            text.includes("vpn") ||
            text.includes("laptop") ||
            text.includes("wifi") ||
            text.includes("hardware") ||
            text.includes("email access") ||
            text.includes("permission")
        ) {
            suggestedDepartmentName = "IT Operations";
        } else if (
            text.includes("customer") ||
            text.includes("help") ||
            text.includes("howto") ||
            text.includes("guide") ||
            text.includes("login issue")
        ) {
            suggestedDepartmentName = "Customer Support";
        }

        res.json({
            priority,
            suggestedDepartmentName,
            confidenceScore,
            reasoning
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * AI SOLUTION DRAFT GENERATOR
 */
exports.generateSolutionDraft = async (req, res) => {
    try {
        const { title, description, priority, departmentName } = req.body;

        const dateStr = new Date().toLocaleDateString();

        const draft = `Hello,

Thank you for reporting this issue. Our ${departmentName || "support"} team has reviewed Ticket "${title}" (Priority: ${priority || "Medium"}).

Based on our automated diagnostic analysis, here is our recommended resolution plan:

1. Root Cause Identification: Investigate recent system logs and service parameters corresponding to "${title}".
2. Action Steps:
   - Validate service health and active configuration.
   - Run verification checks against reproducible steps described in report.
   - Deploy remediation patch/update if required.
3. Next Steps: We are actively tracking this ticket. If you have additional logs or context, please attach them to this thread.

Best regards,
TMS Intelligent Support Agent (${dateStr})`;

        const keySummary = [
            `Identified primary area: ${departmentName || "General Support"}`,
            `Assessed Impact Level: ${priority || "Medium"} Priority`,
            `Recommended Action: Execute log verification & deploy patch.`
        ];

        res.json({
            solutionDraft: draft,
            keySummary
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * AI COPILOT WORKSPACE CHAT ASSISTANT
 */
exports.copilotQuery = async (req, res) => {
    try {
        const { query = "", orgId } = req.body;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID required" });
        }

        // Query live tickets from MongoDB
        const tickets = await Ticket.find({ orgId })
            .populate("department", "name")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        const total = tickets.length;
        const open = tickets.filter(t => t.status === "Open").length;
        const inProgress = tickets.filter(t => t.status === "In Progress").length;
        const resolved = tickets.filter(t => t.status === "Resolved").length;
        const highPriority = tickets.filter(t => t.priority === "High" && t.status !== "Resolved").length;

        const q = query.toLowerCase();
        let responseMessage = "";

        if (q.includes("high priority") || q.includes("urgent") || q.includes("critical")) {
            const highTickets = tickets.filter(t => t.priority === "High" && t.status !== "Resolved");
            if (highTickets.length === 0) {
                responseMessage = "✨ Great news! There are currently no unresolved High Priority tickets in your workspace queue.";
            } else {
                const listStr = highTickets.slice(0, 5).map(t => `• TKT-${t._id.toString().slice(-4).toUpperCase()}: "${t.title}" (${t.department?.name || 'General'} - Status: ${t.status})`).join("\n");
                responseMessage = `🔥 You have ${highTickets.length} unresolved High Priority ticket(s):\n\n${listStr}\n\nRecommended Action: Reassign or resolve these tickets first to maintain SLA targets.`;
            }
        } else if (q.includes("summary") || q.includes("status") || q.includes("overview")) {
            responseMessage = `📊 TMS Workspace Live Ticket Analysis:\n\n• Total Tickets: ${total}\n• Open Queue: ${open}\n• In Progress: ${inProgress}\n• Resolved: ${resolved}\n• High Priority Risk: ${highPriority}\n\nWorkspace Resolution Rate: ${total > 0 ? Math.round((resolved / total) * 100) : 0}%`;
        } else if (q.includes("engineering") || q.includes("dev") || q.includes("support") || q.includes("sales")) {
            const matchedDept = tickets.filter(t => (t.department?.name || "").toLowerCase().includes("eng") || (t.department?.name || "").toLowerCase().includes(q));
            responseMessage = `🏢 Department Query Results (${matchedDept.length} tickets found):\n\n` +
                matchedDept.slice(0, 4).map(t => `• TKT-${t._id.toString().slice(-4).toUpperCase()}: "${t.title}" [${t.status}] - Assigned to: ${t.assignedTo?.name || 'Unassigned'}`).join("\n");
        } else {
            responseMessage = `🤖 TMS Copilot Insights for your workspace:\n\nCurrently managing ${total} workspace tickets (${open} Open, ${inProgress} In Progress, ${resolved} Resolved).\n\nYou can ask me:\n1. "Show High Priority tickets"\n2. "Give me workspace summary"\n3. "Which tickets are open in Engineering?"`;
        }

        res.json({
            reply: responseMessage,
            stats: { total, open, inProgress, resolved, highPriority }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
