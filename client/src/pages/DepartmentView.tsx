import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import api from "../api/axios";
import { useOrg } from "../context/OrgContext";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    Users,
    Shield,
    Mail,
    Phone,
    Briefcase,
    ExternalLink,
    Crown,
    Search,
    CheckCircle2,
    Lock
} from "lucide-react";

interface Department {
    _id: string;
    name: string;
    description?: string;
}

interface Member {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        phone?: string;
    };
    department?: {
        _id: string;
        name: string;
    } | null;
    role: string;
}

interface Ticket {
    _id: string;
    title: string;
    priority: "Low" | "Medium" | "High";
    status: "Open" | "In Progress" | "Resolved";
    department?: {
        _id: string;
        name: string;
    };
    createdBy?: {
        _id: string;
        name: string;
    };
    assignedTo?: {
        _id: string;
        name: string;
    } | null;
    createdAt: string;
}

import AnnouncementBanner from "../components/AnnouncementBanner";

export default function DepartmentView() {
    const { activeOrg } = useOrg();
    const navigate = useNavigate();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const [userRole, setUserRole] = useState<string>("member");
    const [userDepartment, setUserDepartment] = useState<{ _id: string; name: string } | null>(null);

    const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [actionMsg, setActionMsg] = useState<string>("");

    const fetchData = async () => {
        if (!activeOrg?._id) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [deptsRes, membersRes, ticketsRes] = await Promise.all([
                api.get(`/depts?orgId=${activeOrg._id}`, { headers }).catch(() => ({ data: [] })),
                api.get(`/orgs/${activeOrg._id}/members`, { headers }),
                api.get(`/tickets?orgId=${activeOrg._id}&tab=all`, { headers })
            ]);

            const fetchedDepts = deptsRes.data || [];
            const fetchedMembers = membersRes.data.members || [];
            const fetchedTickets = ticketsRes.data.tickets || [];

            const role = ticketsRes.data.userRole || "member";
            const userDept = ticketsRes.data.userDepartment || null;

            setDepartments(fetchedDepts);
            setMembers(fetchedMembers);
            setTickets(fetchedTickets);
            setUserRole(role);
            setUserDepartment(userDept);

            const isOrgAdmin = ["owner", "org_admin"].includes(role);

            // Scoping: If user is not an Admin/Owner, strictly default to their own department
            if (!isOrgAdmin) {
                if (userDept?._id) {
                    setSelectedDeptId(userDept._id);
                } else {
                    setSelectedDeptId("unassigned");
                }
            } else {
                // Admins can default to their own department if present, or all
                if (userDept?._id) {
                    setSelectedDeptId(userDept._id);
                } else {
                    setSelectedDeptId("all");
                }
            }
        } catch (err) {
            console.error("Failed to load department view data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeOrg]);

    const isOrgAdmin = ["owner", "org_admin"].includes(userRole);

    // Visible Departments for switching tabs (Admins see all, regular members see ONLY their department)
    const visibleDepartments = useMemo(() => {
        if (isOrgAdmin) {
            return departments;
        }
        if (userDepartment?._id) {
            return departments.filter(d => d._id === userDepartment._id);
        }
        return [];
    }, [departments, isOrgAdmin, userDepartment]);

    // Filter members based strictly on selected department & search query
    const filteredMembers = useMemo(() => {
        return members.filter((m) => {
            const mDeptId = m.department?._id;

            if (selectedDeptId !== "all") {
                if (selectedDeptId === "unassigned") {
                    if (mDeptId) return false;
                } else {
                    if (mDeptId !== selectedDeptId) return false;
                }
            }

            // Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = m.user?.name?.toLowerCase().includes(q);
                const emailMatch = m.user?.email?.toLowerCase().includes(q);
                const roleMatch = m.role?.toLowerCase().includes(q);
                const deptMatch = m.department?.name?.toLowerCase().includes(q);
                if (!nameMatch && !emailMatch && !roleMatch && !deptMatch) return false;
            }

            return true;
        });
    }, [members, selectedDeptId, searchQuery]);

    // Filter tickets strictly based on selected department
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            if (selectedDeptId === "all") return true;
            const tDeptId = t.department?._id;
            if (selectedDeptId === "unassigned") return !tDeptId;
            return tDeptId === selectedDeptId;
        });
    }, [tickets, selectedDeptId]);

    // Get active department name
    const selectedDeptObj = departments.find(d => d._id === selectedDeptId);
    const activeDeptName = selectedDeptId === "all"
        ? "All Workspace Departments"
        : selectedDeptId === "unassigned"
        ? "General / Unassigned"
        : (selectedDeptObj?.name || userDepartment?.name || "My Department");

    // Get active department lead
    const deptLead = members.find((m) => {
        const mDeptId = m.department?._id;
        const matchesDept = selectedDeptId === "all" ? true : mDeptId === selectedDeptId;
        return matchesDept && ["team_lead", "department_manager", "owner", "org_admin"].includes(m.role);
    });

    const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "US";

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case "owner":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "org_admin":
                return "bg-indigo-100 text-indigo-800 border-indigo-200";
            case "department_manager":
            case "team_lead":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "member":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    // Quick status update for ticket
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
            fetchData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
                <Navbar />
                <div className="ml-64 p-10 flex flex-col items-center justify-center h-[80vh]">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-medium text-sm">Loading Department Team Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
            <Navbar />

            <div className="ml-64 p-8">
                <Topbar />
                <AnnouncementBanner />

                {/* Header */}
                <div className="mt-8 mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight text-[#172b4d] flex items-center gap-2.5">
                                <Building2 className="text-blue-600" size={28} />
                                {activeDeptName} Team Portal
                            </h1>
                            {!isOrgAdmin && (
                                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                                    <Lock size={12} /> Dept Scoped
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm">
                            Exclusive department portal for <span className="font-semibold text-slate-800">{activeDeptName}</span> in <span className="font-semibold text-slate-800">{activeOrg?.name || "your workspace"}</span>.
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative min-w-[240px]">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${activeDeptName} team...`}
                            className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Success Banner */}
                {actionMsg && (
                    <div className="mb-6 p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 text-sm font-medium shadow-sm">
                        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                        {actionMsg}
                    </div>
                )}

                {/* DEPARTMENT TABS (Only shown if Admin or multiple depts accessible) */}
                {isOrgAdmin && (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6 p-2 overflow-x-auto flex items-center gap-2">
                        <button
                            onClick={() => setSelectedDeptId("all")}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                selectedDeptId === "all"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                            <Building2 size={14} />
                            All Departments
                        </button>

                        {visibleDepartments.map((d) => {
                            const count = members.filter(m => m.department?._id === d._id).length;
                            return (
                                <button
                                    key={d._id}
                                    onClick={() => setSelectedDeptId(d._id)}
                                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                        selectedDeptId === d._id
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                                    }`}
                                >
                                    <Users size={14} />
                                    {d.name}
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        selectedDeptId === d._id ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ACTIVE DEPARTMENT METRICS CARD */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</p>
                        <h2 className="text-xl font-extrabold text-slate-900 mt-1 truncate">{activeDeptName}</h2>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Members</p>
                        <h2 className="text-2xl font-extrabold text-indigo-600 mt-1">{filteredMembers.length} People</h2>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Crown size={14} className="text-amber-500" /> Dept Lead / Manager
                        </p>
                        <h2 className="text-base font-bold text-slate-800 mt-1 truncate">
                            {deptLead?.user?.name || "Unassigned Lead"}
                        </h2>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Queue</p>
                        <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">{filteredTickets.length} Tickets</h2>
                    </div>
                </div>

                {/* DEPARTMENT PEOPLE & ROSTER GRID */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-[#172b4d] flex items-center gap-2">
                                <Users size={18} className="text-blue-600" />
                                {activeDeptName} Members Roster ({filteredMembers.length})
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Showing only people present in the <span className="font-semibold text-slate-800">{activeDeptName}</span> team.
                            </p>
                        </div>
                    </div>

                    {filteredMembers.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded border border-dashed border-slate-200">
                            No team members assigned to {activeDeptName} yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMembers.map((m) => {
                                const uName = m.user?.name || "Unknown";
                                const uEmail = m.user?.email || "—";
                                const uAvatar = m.user?.avatar;
                                const uPhone = m.user?.phone;
                                const deptName = m.department?.name || "General";
                                const roleTitle = m.role.replace('_', ' ');

                                return (
                                    <div
                                        key={m._id}
                                        className="bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg p-4 transition-all hover:shadow-md flex flex-col justify-between"
                                    >
                                        <div className="flex items-start gap-3">
                                            {uAvatar ? (
                                                <img
                                                    src={uAvatar}
                                                    alt={uName}
                                                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs shrink-0">
                                                    {getInitials(uName)}
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="text-sm font-bold text-slate-900 truncate">
                                                        {uName}
                                                    </h3>
                                                    {["team_lead", "department_manager"].includes(m.role) && (
                                                        <span title="Department Lead">
                                                            <Crown size={14} className="text-amber-500 shrink-0" />
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                    <Mail size={12} className="shrink-0 text-slate-400" />
                                                    {uEmail}
                                                </p>

                                                {uPhone && (
                                                    <p className="text-[11px] text-blue-600 font-medium truncate flex items-center gap-1 mt-0.5">
                                                        <Phone size={11} className="shrink-0 text-blue-500" />
                                                        {uPhone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Role & Department Badges */}
                                        <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${getRoleBadgeStyle(m.role)}`}>
                                                <Shield size={11} />
                                                <span className="capitalize">{roleTitle}</span>
                                            </span>

                                            <span className="bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 border border-slate-300">
                                                <Building2 size={11} className="text-slate-600" />
                                                <span>{deptName}</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* DEPARTMENT TICKET QUEUE SECTION */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-[#172b4d] flex items-center gap-2">
                                <Briefcase size={18} className="text-blue-600" />
                                {activeDeptName} Ticket Queue ({filteredTickets.length})
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Live status and workflow transition for tickets assigned to {activeDeptName}.
                            </p>
                        </div>
                    </div>

                    {filteredTickets.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded border border-dashed border-slate-200">
                            No active tickets currently logged in {activeDeptName}.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                                        <th className="px-4 py-3">Key</th>
                                        <th className="px-4 py-3">Summary</th>
                                        <th className="px-4 py-3">Assignee</th>
                                        <th className="px-4 py-3">Reporter</th>
                                        <th className="px-4 py-3">Priority</th>
                                        <th className="px-4 py-3">Status</th>
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

                                            <td className="px-4 py-3 text-slate-700 font-medium">
                                                {t.assignedTo?.name || <span className="text-amber-600 italic">Unassigned</span>}
                                            </td>

                                            <td className="px-4 py-3 text-slate-600">
                                                {t.createdBy?.name || "—"}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded font-bold ${
                                                    t.priority === "High"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}>
                                                    {t.priority}
                                                </span>
                                            </td>

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
        </div>
    );
}
