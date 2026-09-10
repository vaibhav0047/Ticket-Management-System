import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import TicketTrendChart from "../components/TicketTrendChart";
import TicketStatusChart from "../components/TicketStatusChart";
import { useOrg } from "../context/OrgContext";
import api from "../api/axios";
import {
    ExternalLink,
    Plus,
    Briefcase,
    Building2,
    Shield,
    CheckCircle2,
    Search,
    Download,
    Filter,
    RefreshCw
} from "lucide-react";

interface Ticket {
    _id: string;
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High";
    status: "Open" | "In Progress" | "Resolved";
    department?: {
        _id: string;
        name: string;
    };
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    assignedTo?: {
        _id: string;
        name: string;
        email: string;
    } | null;
    createdAt: string;
}

interface Member {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    department?: {
        _id: string;
        name: string;
    } | null;
    role: string;
}

interface Department {
    _id: string;
    name: string;
}

import AnnouncementBanner from "../components/AnnouncementBanner";

export default function Dashboard() {
    const { activeOrg } = useOrg();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<"my_tickets" | "dept_queue" | "all">("my_tickets");
    const [userRole, setUserRole] = useState<string>("member");
    const [userDepartment, setUserDepartment] = useState<{ _id: string; name: string } | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        inProgress: 0,
        open: 0,
    });

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [reassigningId, setReassigningId] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState("");
    const [exporting, setExporting] = useState(false);

    // Advanced Filtering States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [deptFilter, setDeptFilter] = useState<string>("all");

    const fetchDashboardData = async () => {
        if (!activeOrg?._id) return;
        setLoadingTickets(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, ticketsRes, membersRes, deptsRes] = await Promise.all([
                api.get(`/tickets/stats?orgId=${activeOrg._id}`, { headers }),
                api.get(`/tickets?orgId=${activeOrg._id}&tab=${activeTab}`, { headers }),
                api.get(`/orgs/${activeOrg._id}/members`, { headers }),
                api.get(`/depts?orgId=${activeOrg._id}`, { headers }).catch(() => ({ data: [] }))
            ]);

            setStats(statsRes.data);
            setTickets(ticketsRes.data.tickets || []);
            setUserRole(ticketsRes.data.userRole || "member");
            setUserDepartment(ticketsRes.data.userDepartment || null);
            setMembers(membersRes.data.members || []);
            setDepartments(deptsRes.data || []);
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        } finally {
            setLoadingTickets(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [activeOrg, activeTab]);

    // Handle Export CSV Download
    const handleExportCSV = async () => {
        if (!activeOrg?._id) return;
        setExporting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`/tickets/export/csv?orgId=${activeOrg._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tms-tickets-${activeOrg.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setActionMsg("Exported tickets CSV successfully!");
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err: any) {
            console.error(err);
            alert("Failed to export tickets CSV");
        } finally {
            setExporting(false);
        }
    };

    // Handle Inline Assignment by Department Lead or Admin
    const handleInlineAssign = async (ticketId: string, newUserId: string) => {
        if (!activeOrg?._id) return;
        setReassigningId(ticketId);
        try {
            const token = localStorage.getItem("token");
            await api.put(
                `/tickets/${ticketId}?orgId=${activeOrg._id}`,
                { assignedTo: newUserId || null },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setActionMsg(newUserId ? "Ticket assigned to team member" : "Ticket unassigned");
            setTimeout(() => setActionMsg(""), 3000);
            fetchDashboardData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to assign ticket");
        } finally {
            setReassigningId(null);
        }
    };

    // Handle Quick Status Update
    const handleQuickStatus = async (ticketId: string, newStatus: "Open" | "In Progress" | "Resolved") => {
        if (!activeOrg?._id) return;
        try {
            const token = localStorage.getItem("token");
            await api.put(
                `/tickets/${ticketId}?orgId=${activeOrg._id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActionMsg(`Ticket status moved to "${newStatus}"`);
            setTimeout(() => setActionMsg(""), 3000);
            fetchDashboardData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to update status");
        }
    };

    // Filter tickets in memory
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            // Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const key = `tkt-${t._id.slice(-4).toLowerCase()}`;
                const titleMatch = t.title.toLowerCase().includes(q);
                const keyMatch = key.includes(q);
                const reporterMatch = t.createdBy?.name.toLowerCase().includes(q);
                const assigneeMatch = t.assignedTo?.name.toLowerCase().includes(q);
                if (!titleMatch && !keyMatch && !reporterMatch && !assigneeMatch) return false;
            }

            // Status Filter
            if (statusFilter !== "all" && t.status !== statusFilter) {
                return false;
            }

            // Priority Filter
            if (priorityFilter !== "all" && t.priority !== priorityFilter) {
                return false;
            }

            // Department Filter
            if (deptFilter !== "all") {
                const deptId = t.department?._id || t.department;
                if (deptId !== deptFilter) return false;
            }

            return true;
        });
    }, [tickets, searchQuery, statusFilter, priorityFilter, deptFilter]);

    const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "??";

    const isLeadOrAdmin = ["owner", "org_admin", "department_manager", "team_lead"].includes(userRole);
    const isAdmin = ["owner", "org_admin"].includes(userRole);

    return (
        <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">

            <Navbar />

            <div className="ml-64 p-8">

                <Topbar />
                <AnnouncementBanner />

                {/* Dashboard Header */}
                <div className="mt-8 mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight text-[#172b4d]">
                                Workspace Dashboard
                            </h1>
                            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                                <Shield size={12} /> {userRole.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            Role-tailored portal for{" "}
                            <span className="font-semibold text-slate-800">
                                {activeOrg?.name || "your workspace"}
                            </span>
                            {userDepartment?.name && (
                                <span className="ml-2 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                                    Dept: {userDepartment.name}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* CSV Export Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-md flex items-center gap-2 text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
                        >
                            <Download size={16} className="text-slate-500" />
                            {exporting ? "Exporting..." : "Export CSV"}
                        </button>

                        <button
                            onClick={() => navigate("/create-ticket")}
                            className="bg-[#0052cc] hover:bg-[#0747a6] text-white px-5 py-2.5 rounded-md flex items-center gap-2 text-sm font-semibold shadow-sm transition-all"
                        >
                            <Plus size={16} />
                            Create Ticket
                        </button>
                    </div>
                </div>

                {/* Success Notification Banner */}
                {actionMsg && (
                    <div className="mb-6 p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 text-sm font-medium shadow-sm">
                        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                        {actionMsg}
                    </div>
                )}

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                    {[
                        ["Total Workspace Tickets", stats.total, "border-blue-500", "text-slate-800"],
                        ["Open Queue", stats.open, "border-sky-500", "text-sky-600"],
                        ["In Progress", stats.inProgress, "border-amber-500", "text-amber-600"],
                        ["Resolved", stats.resolved, "border-emerald-500", "text-emerald-600"],
                    ].map(([title, value, borderColor, textColor]) => (
                        <div
                            key={title as string}
                            className={`bg-white rounded-lg p-5 shadow-sm border-l-4 ${borderColor} border-t border-r border-b border-slate-200`}
                        >
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {title}
                            </p>
                            <h2 className={`text-3xl font-extrabold mt-2 ${textColor}`}>
                                {value}
                            </h2>
                        </div>
                    ))}
                </div>

                {/* ROLE-BASED PORTALS TAB SWITCHER */}
                <div className="mt-8 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("my_tickets")}
                            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all shrink-0 ${
                                activeTab === "my_tickets"
                                    ? "border-blue-600 text-blue-600 bg-white"
                                    : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Briefcase size={16} />
                            My Assigned Work
                        </button>

                        <button
                            onClick={() => setActiveTab("dept_queue")}
                            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all shrink-0 ${
                                activeTab === "dept_queue"
                                    ? "border-blue-600 text-blue-600 bg-white"
                                    : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Building2 size={16} />
                            Department Lead Queue
                            {isLeadOrAdmin && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                    Lead
                                </span>
                            )}
                        </button>

                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all shrink-0 ${
                                    activeTab === "all"
                                        ? "border-blue-600 text-blue-600 bg-white"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Shield size={16} />
                                Org Command Center
                                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                    Admin
                                </span>
                            </button>
                        )}
                    </div>

                    {/* ADVANCED FILTER BAR */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3">
                        {/* Search Query */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by title, key (TKT-1234), or member..."
                                className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs">
                            <Filter size={13} className="text-slate-400" />
                            <span className="text-slate-500 font-medium">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs">
                            <span className="text-slate-500 font-medium">Priority:</span>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="all">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        {/* Department Filter */}
                        {departments.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs">
                                <span className="text-slate-500 font-medium">Department:</span>
                                <select
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map((d) => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Reset Filters */}
                        {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || deptFilter !== "all") && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                    setPriorityFilter("all");
                                    setDeptFilter("all");
                                }}
                                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                            >
                                <RefreshCw size={12} /> Clear Filters
                            </button>
                        )}
                    </div>

                    {/* PORTAL TABLE CONTENT */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-[#172b4d] flex items-center gap-2">
                                    {activeTab === "my_tickets" && "Work Assigned to Me & Reported Issues"}
                                    {activeTab === "dept_queue" && "Department Incoming Queue & Lead Assignment"}
                                    {activeTab === "all" && "All Workspace Tickets Oversight"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {activeTab === "my_tickets" && "Track tickets assigned to you or created by you."}
                                    {activeTab === "dept_queue" && "Department Leads can assign unassigned tickets directly to team members below."}
                                    {activeTab === "all" && "Organization-wide ticket oversight across all departments."}
                                </p>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                                Showing {filteredTickets.length} of {tickets.length} tickets
                            </span>
                        </div>

                        {loadingTickets ? (
                            <div className="py-12 text-center text-slate-500 text-sm">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                Fetching role portal data...
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-sm bg-slate-50 rounded border border-dashed border-slate-200">
                                No matching tickets found for the selected filters.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                                            <th className="px-4 py-3">Key</th>
                                            <th className="px-4 py-3">Summary</th>
                                            <th className="px-4 py-3">Department</th>
                                            <th className="px-4 py-3">Assignee (Dept Member / Lead)</th>
                                            <th className="px-4 py-3">Reporter</th>
                                            <th className="px-4 py-3">Priority</th>
                                            <th className="px-4 py-3">Status Progress</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredTickets.map((t) => (
                                            <tr key={t._id} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-500">
                                                    TKT-{t._id.slice(-4).toUpperCase()}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">
                                                    {t.title}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                                                        {t.department?.name || "General"}
                                                    </span>
                                                </td>

                                                {/* INLINE ASSIGNEE PICKER FOR LEADS/ADMINS */}
                                                <td className="px-4 py-3">
                                                    {isLeadOrAdmin ? (
                                                        <select
                                                            disabled={reassigningId === t._id}
                                                            value={t.assignedTo?._id || ""}
                                                            onChange={(e) => handleInlineAssign(t._id, e.target.value)}
                                                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:border-blue-500 outline-none w-44"
                                                        >
                                                            <option value="">-- Unassigned --</option>
                                                            {members.map((m) => (
                                                                <option key={m._id} value={m.user._id}>
                                                                    {m.user.name} ({m.department?.name || "General"})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : t.assignedTo ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                                                                {getInitials(t.assignedTo.name)}
                                                            </div>
                                                            <span className="font-medium text-slate-800">{t.assignedTo.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-600 italic">Unassigned Lead</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-slate-600">
                                                    {t.createdBy?.name || "—"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded font-bold ${
                                                        t.priority === "High"
                                                            ? "bg-red-100 text-red-700"
                                                            : t.priority === "Medium"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-slate-100 text-slate-700"
                                                    }`}>
                                                        {t.priority}
                                                    </span>
                                                </td>

                                                {/* QUICK STATUS WORKFLOW DROPDOWN */}
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={t.status}
                                                        onChange={(e) => handleQuickStatus(t._id, e.target.value as any)}
                                                        className={`px-2 py-1 rounded text-xs font-bold border outline-none cursor-pointer ${
                                                            t.status === "Resolved"
                                                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                                                : t.status === "In Progress"
                                                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                                                : "bg-blue-50 text-blue-800 border-blue-300"
                                                        }`}
                                                    >
                                                        <option value="Open">Open</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Resolved">Resolved</option>
                                                    </select>
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => navigate(`/ticket/${t._id}`)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded inline-flex items-center gap-1 font-semibold text-xs transition-colors"
                                                    >
                                                        Details <ExternalLink size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* CHARTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <h2 className="text-base font-bold text-[#172b4d] mb-4">
                            Ticket Activity Trends
                        </h2>
                        <TicketTrendChart orgId={activeOrg?._id} />
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <h2 className="text-base font-bold text-[#172b4d] mb-4">
                            Status Distribution
                        </h2>
                        <TicketStatusChart orgId={activeOrg?._id} />
                    </div>
                </div>

            </div>

        </div>
    );
}