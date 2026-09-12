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
        <div style="font-family: Arial, sans-serif; max-width:650px; margin:auto; border:1px solid #e2e8f0; border-radius:10px; padding:25px; background-color:#ffffff;">
            <div style="background-color:#0052cc; color:#ffffff; padding:15px 20px; border-radius:8px; margin-bottom:20px;">
                <h2 style="margin:0; font-size:20px;">⚡ TMS Admin Oversight Automation</h2>
                <p style="margin:5px 0 0 0; font-size:13px; opacity:0.9;">${actionTitle}</p>
            </div>
            
            <table style="width:100%; border-collapse:collapse; font-size:14px; color:#172b4d;">
                <tr>
                    <td style="padding:8px 0; font-weight:bold; width:35%;">Ticket Key:</td>
                    <td style="padding:8px 0;"><span style="background-color:#e2e8f0; padding:2px 8px; border-radius:4px; font-family:monospace; font-weight:bold;">${ticketKey}</span></td>
                </tr>
                <tr>
                    <td style="padding:8px 0; font-weight:bold;">Title / Summary:</td>
                    <td style="padding:8px 0; font-weight:bold; color:#0052cc;">${ticket.title}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0; font-weight:bold;">Created By (Lead/User):</td>
                    <td style="padding:8px 0;">${creatorName} (${creatorEmail})</td>
                </tr>
                <tr>
                    <td style="padding:8px 0; font-weight:bold;">Department:</td>
                    <td style="padding:8px 0;">${deptName}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0; font-weight:bold;">Priority Level:</td>
                    <td style="padding:8px 0;"><span style="padding:2px 8px; border-radius:4px; font-weight:bold; ${ticket.priority === 'High' ? 'background-color:#fed7d7; color:#9b2c2c;' : 'background-color:#feebc8; color:#9c4221;'}">${ticket.priority || 'Medium'}</span></td>
                </tr>
                <tr>
                    <td style="padding:8px 0; font-weight:bold;">Status Progress:</td>
                    <td style="padding:8px 0;"><span style="background-color:#ebf8ff; color:#2b6cb0; padding:2px 8px; border-radius:4px; font-weight:bold;">${ticket.status}</span></td>
                </tr>
                <tr>
                    <td style="padding:8px 0; font-weight:bold;">Assigned Lead/Agent:</td>
                    <td style="padding:8px 0;">${assigneeName}</td>
                </tr>
            </table>

            <div style="margin-top:20px; padding:15px; background-color:#f7fafc; border-left:4px solid #0052cc; border-radius:4px;">
                <strong style="display:block; margin-bottom:5px; font-size:13px; color:#4a5568;">Ticket Description:</strong>
                <p style="margin:0; font-size:13px; color:#2d3748; white-space:pre-wrap;">${ticket.description || "No description provided."}</p>
            </div>

            <div style="margin-top:25px; text-align:center;">
                <a href="${clientUrl}/ticket/${ticket._id}" style="display:inline-block; background-color:#0052cc; color:#ffffff; padding:12px 24px; border-radius:6px; font-weight:bold; text-decoration:none; font-size:14px;">
                    View Details in TMS Command Center
                </a>
            </div>
            
            <p style="margin-top:30px; font-size:11px; color:#718096; text-align:center; border-top:1px solid #edf2f7; padding-top:15px;">
                Automated Admin Notification dispatched by Ticket Management System (TMS).
            </p>
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
        if (assignedToUser) {
            const leadUser = await User.findById(assignedToUser);
            if (leadUser?.email) {
                sendEmail(
                    leadUser.email,
                    `[TMS Alert] New Ticket Assigned: ${title}`,
                    `<div style="font-family: sans-serif; max-width:600px; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
                        <h3 style="color:#0052cc; margin-top:0;">New Ticket Assigned to Your Queue 🚀</h3>
                        <p><strong>Title:</strong> ${title}</p>
                        <p><strong>Priority:</strong> ${priority || "Medium"}</p>
                        <p><strong>Description:</strong> ${description}</p>
                        <br/>
                        <a href="${getClientUrl(req)}/ticket/${ticket._id}" style="display:inline-block; padding:10px 20px; background:#0052cc; color:white; text-decoration:none; border-radius:4px; font-weight:bold;">View Ticket in TMS</a>
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
                `<div style="font-family: sans-serif; max-width:600px; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
                    <h3 style="color:#0052cc; margin-top:0;">Your Ticket Has Been Created Successfully 🎯</h3>
                    <p><strong>Ticket Key:</strong> <span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-family:monospace; font-weight:bold;">${ticketKey}</span></p>
                    <p><strong>Title:</strong> ${title}</p>
                    <p><strong>Priority:</strong> ${priority || "Medium"}</p>
                    <p><strong>Description:</strong> ${description || "No description provided."}</p>
                    <br/>
                    <a href="${getClientUrl(req)}/ticket/${ticket._id}" style="display:inline-block; padding:10px 20px; background:#0052cc; color:white; text-decoration:none; border-radius:4px; font-weight:bold;">View Your Ticket in TMS Command Center</a>
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
                    sendEmail(
                        reporter.email,
                        `[TMS Alert] Ticket Status Updated: ${ticket.title}`,
                        `<div style="font-family: sans-serif; max-width:600px; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
                            <h3 style="color:#0052cc; margin-top:0;">Ticket Status Update Notification 🔔</h3>
                            <p><strong>Ticket:</strong> ${ticket.title}</p>
                            <p><strong>Status Changed:</strong> <span style="color:#e53e3e;">${prevStatus}</span> &rarr; <span style="color:#38a169; font-weight:bold;">${status}</span></p>
                            <br/>
                            <a href="${getClientUrl(req)}/ticket/${ticket._id}" style="display:inline-block; padding:10px 20px; background:#0052cc; color:white; text-decoration:none; border-radius:4px; font-weight:bold;">View Ticket in TMS</a>
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