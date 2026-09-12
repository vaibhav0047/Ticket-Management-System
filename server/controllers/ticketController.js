const Ticket = require("../models/Ticket");
const Membership = require("../models/Membership");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const dispatchWebhooks = require("../utils/dispatchWebhooks");
const getClientUrl = require("../utils/getClientUrl");

/**
 * HELPER: AUTOMATION TO NOTIFY ORG ADMINS/OWNERS ON TICKET EVENTS
 */
const notifyOrgAdmins = async (orgId, subject, ticket, actionTitle) => {
    try {
        const adminMemberships = await Membership.find({
            orgId: orgId,
            role: { $in: ["owner", "org_admin"] }
        }).populate("userId", "name email");

        const adminEmails = adminMemberships
            .map(m => m.userId?.email)
            .filter(Boolean);

        if (adminEmails.length === 0) return;

        const ticketKey = `TKT-${ticket._id.toString().slice(-5).toUpperCase()}`;
        const creatorName = ticket.createdBy?.name || "Team Member";
        const creatorEmail = ticket.createdBy?.email || "N/A";
        const deptName = ticket.department?.name || ticket.department || "General";
        const assigneeName = ticket.assignedTo?.name || "Unassigned Lead";
        const clientUrl = getClientUrl();

        const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background-color:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0052cc 0%, #0747a6 100%); color:#ffffff; padding:20px 25px;">
                <div style="display:inline-block; background:rgba(255,255,255,0.2); color:#fff; padding:3px 10px; border-radius:4px; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">Admin Oversight Automation</div>
                <h2 style="margin:0; font-size:20px; font-weight:700;">⚡ TMS Workspace Alert</h2>
                <p style="margin:4px 0 0 0; font-size:13px; opacity:0.9;">${actionTitle}</p>
            </div>
            
            <div style="padding:25px; color:#172b4d;">
                <div style="margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid #f1f5f9;">
                    <span style="background-color:#e2e8f0; color:#334155; padding:3px 8px; border-radius:4px; font-family:monospace; font-weight:bold; font-size:12px;">${ticketKey}</span>
                    <span style="float:right; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:bold; ${ticket.priority === 'High' ? 'background-color:#fee2e2; color:#991b1b;' : 'background-color:#fef3c7; color:#92400e;'}">${ticket.priority || 'Medium'} Priority</span>
                    <h3 style="margin:10px 0 0 0; font-size:17px; font-weight:700; color:#0f172a;">${ticket.title}</h3>
                </div>

                <table style="width:100%; border-collapse:collapse; font-size:13px; color:#334155; margin-bottom:20px;">
                    <tr>
                        <td style="padding:6px 0; font-weight:bold; color:#64748b; width:40%;">Reporter:</td>
                        <td style="padding:6px 0; font-weight:600;">${creatorName} (${creatorEmail})</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0; font-weight:bold; color:#64748b;">Department:</td>
                        <td style="padding:6px 0; font-weight:600;">${deptName}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0; font-weight:bold; color:#64748b;">Assigned Lead:</td>
                        <td style="padding:6px 0; font-weight:600;">${assigneeName}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0; font-weight:bold; color:#64748b;">Status:</td>
                        <td style="padding:6px 0;"><span style="background-color:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:12px;">${ticket.status}</span></td>
                    </tr>
                </table>

                <div style="padding:14px; background-color:#f8fafc; border-left:4px solid #0052cc; border-radius:6px; margin-bottom:22px;">
                    <strong style="display:block; margin-bottom:4px; font-size:11px; text-transform:uppercase; color:#64748b;">Description:</strong>
                    <p style="margin:0; font-size:13px; color:#334155; line-height:1.5; white-space:pre-wrap;">${ticket.description || "No description provided."}</p>
                </div>

                <div style="text-align:center; margin-top:20px;">
                    <a href="${clientUrl}/ticket/${ticket._id}" style="display:inline-block; background-color:#0052cc; color:#ffffff; padding:12px 26px; border-radius:6px; font-weight:bold; text-decoration:none; font-size:14px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        View Ticket in TMS Portal &rarr;
                    </a>
                </div>
            </div>
            
            <div style="background-color:#f8fafc; padding:14px 25px; text-align:center; border-top:1px solid #f1f5f9; font-size:11px; color:#94a3b8;">
                Automated Admin Notification • Ticket Management System (TMS)
            </div>
        </div>
        `;

        for (const adminEmail of adminEmails) {
            sendEmail(adminEmail, subject, html).catch((err) =>
                console.error(`Admin email automation error for ${adminEmail}:`, err)
            );
        }
    } catch (err) {
        console.error("Failed to execute notifyOrgAdmins:", err);
    }
};

/**
 * EXPORT TICKETS TO CSV
 */
exports.exportTicketsCSV = async (req, res) => {
    try {
        const { orgId } = req.query;
        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required" });
        }

        const tickets = await Ticket.find({ orgId })
            .populate("createdBy", "name email")
            .populate("department", "name")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        let csv = "Ticket Key,Summary,Department,Assignee,Reporter,Priority,Status,Created At\n";

        tickets.forEach((t) => {
            const key = `TKT-${t._id.toString().slice(-5).toUpperCase()}`;
            const title = `"${(t.title || "").replace(/"/g, '""')}"`;
            const dept = `"${t.department?.name || "General"}"`;
            const assignee = `"${t.assignedTo?.name || "Unassigned"}"`;
            const reporter = `"${t.createdBy?.name || "Unknown"}"`;
            const priority = t.priority || "Medium";
            const status = t.status || "Open";
            const date = `"${new Date(t.createdAt).toISOString()}"`;

            csv += `${key},${title},${dept},${assignee},${reporter},${priority},${status},${date}\n`;
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=tickets-export-${Date.now()}.csv`);
        res.status(200).send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET TICKET STATS
 */
exports.getTicketStats = async (req, res) => {
    try {
        const { orgId } = req.query;
        if (!orgId) {
            return res.status(400).json({
                message: "Organization ID is required"
            });
        }

        const total = await Ticket.countDocuments({ orgId });
        const open = await Ticket.countDocuments({ orgId, status: "Open" });
        const inProgress = await Ticket.countDocuments({ orgId, status: "In Progress" });
        const resolved = await Ticket.countDocuments({ orgId, status: "Resolved" });

        res.json({
            total,
            open,
            inProgress,
            resolved
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

/**
 * GET TICKET STATUS BREAKDOWN (Pie Chart)
 */
exports.getTicketStatus = async (req, res) => {
    try {
        const { orgId } = req.query;
        if (!orgId) {
            return res.status(400).json({
                message: "Organization ID is required"
            });
        }

        const open = await Ticket.countDocuments({ orgId, status: "Open" });
        const inProgress = await Ticket.countDocuments({ orgId, status: "In Progress" });
        const resolved = await Ticket.countDocuments({ orgId, status: "Resolved" });

        const data = [
            { name: "Open", value: open },
            { name: "In Progress", value: inProgress },
            { name: "Resolved", value: resolved }
        ];

        res.json({ data });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

/**
 * GET TICKET TRENDS (Line Chart)
 */
exports.getTicketTrends = async (req, res) => {
    try {
        const { orgId } = req.query;
        if (!orgId) {
            return res.status(400).json({
                message: "Organization ID is required"
            });
        }

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const trendData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = await Ticket.countDocuments({
                orgId,
                createdAt: { $gte: d, $lt: nextD }
            });
            trendData.push({
                month: months[d.getMonth()],
                tickets: count
            });
        }

        res.json({ data: trendData });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

/**
 * CREATE TICKET
 * Auto-routes ticket to the Department Lead/Manager upon creation.
 */
exports.createTicket = async (req, res) => {
    try {
        const { title, description, priority, departmentId, orgId } = req.body;

        // Verify user is part of the organization
        const membership = await Membership.findOne({
            userId: req.user.id,
            orgId: orgId
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not authorized to create tickets for this organization"
            });
        }

        // Auto-route ticket: find team_lead or department_manager for the selected department
        let assignedToUser = null;
        if (departmentId) {
            const deptLeadMembership = await Membership.findOne({
                orgId: orgId,
                departmentId: departmentId,
                role: { $in: ["team_lead", "department_manager"] }
            });
            if (deptLeadMembership) {
                assignedToUser = deptLeadMembership.userId;
            }
        }

        // Fallback to Organization Owner / Admin if no department lead found
        if (!assignedToUser) {
            const orgAdminMembership = await Membership.findOne({
                orgId: orgId,
                role: { $in: ["owner", "org_admin"] }
            });
            if (orgAdminMembership) {
                assignedToUser = orgAdminMembership.userId;
            }
        }

        const ticket = await Ticket.create({
            title,
            description,
            priority: priority || "Medium",
            department: departmentId,
            orgId,
            assignedTo: assignedToUser,
            createdBy: req.user.id,
        });

        // Record Activity Log
        await ActivityLog.create({
            ticketId: ticket._id,
            user: req.user.id,
            action: "Created ticket",
        });

        // Send email alert to assigned lead if available
        const clientUrl = getClientUrl();
        if (assignedToUser) {
            const leadUser = await User.findById(assignedToUser);
            if (leadUser?.email) {
                const ticketKey = `TKT-${ticket._id.toString().slice(-5).toUpperCase()}`;
                sendEmail(
                    leadUser.email,
                    `[TMS Alert] New Ticket Assigned: ${title}`,
                    `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background-color:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #0052cc 0%, #0747a6 100%); color:#ffffff; padding:20px 25px;">
                            <div style="display:inline-block; background:rgba(255,255,255,0.2); color:#fff; padding:3px 10px; border-radius:4px; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">Assignment Notification</div>
                            <h2 style="margin:0; font-size:20px; font-weight:700;">New Ticket Assigned to Your Queue 🚀</h2>
                        </div>
                        <div style="padding:25px; color:#172b4d;">
                            <div style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
                                <span style="background-color:#e2e8f0; color:#334155; padding:3px 8px; border-radius:4px; font-family:monospace; font-weight:bold; font-size:12px;">${ticketKey}</span>
                                <span style="float:right; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:bold; ${priority === 'High' ? 'background-color:#fee2e2; color:#991b1b;' : 'background-color:#fef3c7; color:#92400e;'}">${priority || 'Medium'} Priority</span>
                                <h3 style="margin:10px 0 0 0; font-size:18px; font-weight:700; color:#0f172a;">${title}</h3>
                            </div>
                            <div style="padding:14px; background-color:#f8fafc; border-left:4px solid #0052cc; border-radius:6px; margin-bottom:22px;">
                                <strong style="display:block; margin-bottom:4px; font-size:11px; text-transform:uppercase; color:#64748b;">Description:</strong>
                                <p style="margin:0; font-size:13px; color:#334155; line-height:1.5; white-space:pre-wrap;">${description || "No description provided."}</p>
                            </div>
                            <div style="text-align:center; margin-top:20px;">
                                <a href="${clientUrl}/ticket/${ticket._id}" style="display:inline-block; background-color:#0052cc; color:#ffffff; padding:12px 26px; border-radius:6px; font-weight:bold; text-decoration:none; font-size:14px;">
                                    View Ticket in TMS Portal &rarr;
                                </a>
                            </div>
                        </div>
                    </div>`
                ).catch((err) => console.error("Email send error:", err));
            }
        }

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate("createdBy", "name email")
            .populate("department", "name")
            .populate("assignedTo", "name email");

        // Send confirmation email to Ticket Creator (Reporter)
        if (populatedTicket.createdBy?.email) {
            const ticketKey = `TKT-${ticket._id.toString().slice(-5).toUpperCase()}`;
            sendEmail(
                populatedTicket.createdBy.email,
                `[TMS Confirmation] Ticket #${ticketKey} Created: ${title}`,
                `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background-color:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color:#ffffff; padding:20px 25px;">
                        <div style="display:inline-block; background:rgba(255,255,255,0.2); color:#fff; padding:3px 10px; border-radius:4px; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">Creation Confirmation</div>
                        <h2 style="margin:0; font-size:20px; font-weight:700;">Your Ticket Has Been Opened 🎯</h2>
                    </div>
                    <div style="padding:25px; color:#172b4d;">
                        <div style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
                            <span style="background-color:#e2e8f0; color:#334155; padding:3px 8px; border-radius:4px; font-family:monospace; font-weight:bold; font-size:12px;">${ticketKey}</span>
                            <span style="float:right; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:bold; ${priority === 'High' ? 'background-color:#fee2e2; color:#991b1b;' : 'background-color:#fef3c7; color:#92400e;'}">${priority || 'Medium'} Priority</span>
                            <h3 style="margin:10px 0 0 0; font-size:18px; font-weight:700; color:#0f172a;">${title}</h3>
                        </div>
                        <div style="padding:14px; background-color:#f8fafc; border-left:4px solid #10b981; border-radius:6px; margin-bottom:22px;">
                            <strong style="display:block; margin-bottom:4px; font-size:11px; text-transform:uppercase; color:#64748b;">Description:</strong>
                            <p style="margin:0; font-size:13px; color:#334155; line-height:1.5; white-space:pre-wrap;">${description || "No description provided."}</p>
                        </div>
                        <div style="text-align:center; margin-top:20px;">
                            <a href="${clientUrl}/ticket/${ticket._id}" style="display:inline-block; background-color:#10b981; color:#ffffff; padding:12px 26px; border-radius:6px; font-weight:bold; text-decoration:none; font-size:14px;">
                                View Your Ticket in TMS Portal &rarr;
                            </a>
                        </div>
                    </div>
                </div>`
            ).catch((err) => console.error("Creator email send error:", err));
        }

        // Automation: Notify Org Admins/Owners on ticket creation by any Lead or Member
        const creatorRoleStr = membership.role.replace('_', ' ');
        notifyOrgAdmins(
            orgId,
            `[TMS Admin Automation] New Ticket Created by ${populatedTicket.createdBy?.name || 'Lead'}: ${populatedTicket.title}`,
            populatedTicket,
            `New Ticket #${populatedTicket._id.toString().slice(-5).toUpperCase()} created/opened by ${populatedTicket.createdBy?.name || 'Lead'} (${creatorRoleStr})`
        );

        // Dispatch Third-Party App Webhooks (Discord, WhatsApp, Salesforce, Custom Webhooks)
        dispatchWebhooks(orgId, "ticket_created", populatedTicket, "New Ticket Opened");
        if (populatedTicket.priority === "High") {
            dispatchWebhooks(orgId, "high_priority_alert", populatedTicket, "🚨 High Priority Ticket Risk Alert");
        }

        res.status(201).json({
            message: "Ticket created successfully",
            ticket: populatedTicket,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

/**
 * GET TICKETS
 * Returns tickets based on user role & department.
 */
exports.getTickets = async (req, res) => {
    try {
        const { orgId, tab } = req.query;

        if (!orgId) {
            return res.status(400).json({
                message: "Organization ID is required"
            });
        }

        const membership = await Membership.findOne({
            userId: req.user.id,
            orgId: orgId
        }).populate("departmentId", "name");

        if (!membership) {
            return res.status(403).json({
                message: "Not part of organization"
            });
        }

        let query = { orgId };

        if (tab === "my_tickets") {
            // My Assigned Work & Reported Tickets
            query.$or = [
                { assignedTo: req.user.id },
                { createdBy: req.user.id }
            ];
        } else if (tab === "dept_queue") {
            // Department Queue for Lead / Team
            if (["owner", "org_admin"].includes(membership.role) || !membership.departmentId) {
                // Admins see all org department tickets
            } else {
                query.department = membership.departmentId;
            }
        } else {
            // Default / All
            if (["owner", "org_admin"].includes(membership.role)) {
                // Admins & Owners see all org tickets
            } else if (["department_manager", "team_lead"].includes(membership.role)) {
                const conditions = [
                    { assignedTo: req.user.id },
                    { createdBy: req.user.id }
                ];
                if (membership.departmentId) {
                    conditions.push({ department: membership.departmentId });
                }
                query.$or = conditions;
            } else {
                const conditions = [
                    { createdBy: req.user.id },
                    { assignedTo: req.user.id }
                ];
                if (membership.departmentId) {
                    conditions.push({ department: membership.departmentId });
                }
                query.$or = conditions;
            }
        }

        const tickets = await Ticket.find(query)
            .populate("createdBy", "name email")
            .populate("department", "name")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        res.json({
            tickets,
            userRole: membership.role,
            userDepartment: membership.departmentId
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

/**
 * GET SINGLE TICKET
 */
exports.getTicketById = async (req, res) => {
    try {
        const { orgId } = req.query;
        const { id } = req.params;

        if (!orgId) {
            return res.status(400).json({
                message: "Organization ID is required"
            });
        }

        const membership = await Membership.findOne({
            userId: req.user.id,
            orgId: orgId
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not part of organization"
            });
        }

        const ticket = await Ticket.findOne({ _id: id, orgId })
            .populate("createdBy", "name email")
            .populate("department", "name")
            .populate("assignedTo", "name email");

        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found"
            });
        }

        // Authorization check
        const isOwnerOrAdmin = ["owner", "org_admin"].includes(membership.role);
        const isDeptLead = ["department_manager", "team_lead"].includes(membership.role) &&
            (membership.departmentId && ticket.department && membership.departmentId.toString() === ticket.department._id.toString());
        const isCreatorOrAssignee = (ticket.createdBy && ticket.createdBy._id.toString() === req.user.id) ||
            (ticket.assignedTo && ticket.assignedTo._id.toString() === req.user.id);
        const isDeptMember = membership.departmentId && ticket.department && (membership.departmentId.toString() === ticket.department._id.toString());

        if (!isOwnerOrAdmin && !isDeptLead && !isCreatorOrAssignee && !isDeptMember) {
            return res.status(403).json({
                message: "Not authorized to view this ticket"
            });
        }

        res.json(ticket);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

/**
 * UPDATE TICKET (Status & Reassignment)
 */
exports.updateTicket = async (req, res) => {
    try {
        const { orgId } = req.query;
        const { id } = req.params;

        if (!orgId) {
            return res.status(400).json({
                message: "Organization ID is required"
            });
        }

        const membership = await Membership.findOne({
            userId: req.user.id,
            orgId: orgId
        });

        if (!membership) {
            return res.status(403).json({
                message: "No access to this organization"
            });
        }

        const ticket = await Ticket.findOne({ _id: id, orgId });

        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found"
            });
        }

        const isOwnerOrAdmin = ["owner", "org_admin"].includes(membership.role);
        const isDeptLead = ["department_manager", "team_lead"].includes(membership.role) &&
            (membership.departmentId && ticket.department && membership.departmentId.toString() === ticket.department.toString());
        const isAssignee = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

        if (!isOwnerOrAdmin && !isDeptLead && !isAssignee) {
            return res.status(403).json({
                message: "Permission denied to update this ticket"
            });
        }

        const { status, assignedTo, priority } = req.body;

        const prevStatus = ticket.status;
        const prevPriority = ticket.priority;
        const prevAssignee = ticket.assignedTo ? ticket.assignedTo.toString() : null;

        if (status && status !== prevStatus) {
            ticket.status = status;
            await ActivityLog.create({
                ticketId: ticket._id,
                user: req.user.id,
                action: `Changed status from "${prevStatus}" to "${status}"`,
            });

            // Send email alert to ticket creator
            if (ticket.createdBy) {
                const reporter = await User.findById(ticket.createdBy);
                if (reporter?.email) {
                    const ticketKey = `TKT-${ticket._id.toString().slice(-5).toUpperCase()}`;
                    const statusColor = status === "Resolved" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : status === "In Progress" ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "linear-gradient(135deg, #475569 0%, #334155 100%)";
                    const badgeColor = status === "Resolved" ? "background-color:#d1fae5; color:#065f46;" : status === "In Progress" ? "background-color:#dbeafe; color:#1e40af;" : "background-color:#f1f5f9; color:#334155;";

                    sendEmail(
                        reporter.email,
                        `[TMS Alert] Ticket #${ticketKey} Status Updated to "${status}"`,
                        `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background-color:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                            <div style="background: ${statusColor}; color:#ffffff; padding:20px 25px;">
                                <div style="display:inline-block; background:rgba(255,255,255,0.2); color:#fff; padding:3px 10px; border-radius:4px; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">Status Update Alert</div>
                                <h2 style="margin:0; font-size:20px; font-weight:700;">Ticket Status Moved to "${status}" 🔔</h2>
                            </div>
                            <div style="padding:25px; color:#172b4d;">
                                <div style="margin-bottom:18px; padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
                                    <span style="background-color:#e2e8f0; color:#334155; padding:3px 8px; border-radius:4px; font-family:monospace; font-weight:bold; font-size:12px;">${ticketKey}</span>
                                    <h3 style="margin:10px 0 0 0; font-size:18px; font-weight:700; color:#0f172a;">${ticket.title}</h3>
                                </div>
                                <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:18px; margin-bottom:22px; text-align:center;">
                                    <span style="font-size:11px; font-weight:bold; color:#64748b; text-transform:uppercase; display:block; margin-bottom:8px;">Status Transition</span>
                                    <span style="display:inline-block; background-color:#e2e8f0; color:#475569; padding:5px 12px; border-radius:6px; font-weight:bold; font-size:13px;">${prevStatus}</span>
                                    <span style="margin:0 10px; color:#94a3b8; font-weight:bold;">&rarr;</span>
                                    <span style="display:inline-block; ${badgeColor} padding:5px 12px; border-radius:6px; font-weight:bold; font-size:13px;">${status}</span>
                                </div>
                                <div style="text-align:center; margin-top:20px;">
                                    <a href="${getClientUrl()}/ticket/${ticket._id}" style="display:inline-block; background-color:#0052cc; color:#ffffff; padding:12px 26px; border-radius:6px; font-weight:bold; text-decoration:none; font-size:14px;">
                                        View Updated Ticket in TMS Portal &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>`
                    ).catch((err) => console.error("Email send error:", err));
                }
            }
        }

        if (priority && priority !== prevPriority) {
            ticket.priority = priority;
            await ActivityLog.create({
                ticketId: ticket._id,
                user: req.user.id,
                action: `Changed priority from "${prevPriority}" to "${priority}"`,
            });
        }

        if (assignedTo !== undefined) {
            const newAssigneeStr = assignedTo ? assignedTo.toString() : null;
            if (newAssigneeStr !== prevAssignee) {
                ticket.assignedTo = assignedTo || null;
                let assigneeName = "Unassigned";
                if (assignedTo) {
                    const assigneeUser = await User.findById(assignedTo);
                    assigneeName = assigneeUser ? assigneeUser.name : "Member";
                }
                await ActivityLog.create({
                    ticketId: ticket._id,
                    user: req.user.id,
                    action: `Reassigned ticket to ${assigneeName}`,
                });
            }
        }

        await ticket.save();

        const updatedTicket = await Ticket.findById(id)
            .populate("createdBy", "name email")
            .populate("department", "name")
            .populate("assignedTo", "name email");

        // Automation: Notify Org Admins on ticket updates
        if (status && status !== prevStatus) {
            notifyOrgAdmins(
                orgId,
                `[TMS Admin Automation] Ticket Status Updated (${prevStatus} -> ${status}): ${updatedTicket.title}`,
                updatedTicket,
                `Ticket status moved from "${prevStatus}" to "${status}"`
            );

            // Dispatch Third-Party App Webhooks (Discord, WhatsApp, Salesforce, Custom Webhooks)
            dispatchWebhooks(orgId, "status_updated", updatedTicket, `Status Moved to "${status}"`);
        }

        res.json({
            message: "Ticket updated successfully",
            ticket: updatedTicket
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};