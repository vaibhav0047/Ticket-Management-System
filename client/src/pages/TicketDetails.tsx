import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { useOrg } from "../context/OrgContext";
import {
    ChevronLeft,
    Clock,
    UserCheck,
    Users,
    ShieldAlert,
    CheckCircle2,
    ArrowRight,
    AlertCircle,
    UserPlus,
    Tag,
    Paperclip,
    Send,
    MessageSquare,
    Lock,
    Activity,
    FileText,
    Download,
    X,
    Flame,
    Wand2
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
    updatedAt: string;
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

interface CommentItem {
    _id: string;
    senderId: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    message: string;
    attachments?: { name: string; url: string; fileType?: string }[];
    isInternal: boolean;
    createdAt: string;
}

interface ActivityItem {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    action: string;
    createdAt: string;
}

export default function TicketDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { activeOrg } = useOrg();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Comment state
    const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
    const [newComment, setNewComment] = useState("");
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<{ name: string; url: string; fileType?: string }[]>([]);
    const [submittingComment, setSubmittingComment] = useState(false);

    // Fetch ticket details, members & comments timeline
    const fetchTicketData = async () => {
        if (!id || !activeOrg?._id) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [ticketRes, membersRes, commentsRes] = await Promise.all([
                api.get(`/tickets/${id}?orgId=${activeOrg._id}`, { headers }),
                api.get(`/orgs/${activeOrg._id}/members`, { headers }),
                api.get(`/comments/${id}`, { headers })
            ]);

            setTicket(ticketRes.data);
            setMembers(membersRes.data.members || []);
            setComments(commentsRes.data.comments || []);
            setActivities(commentsRes.data.activities || []);
            setError("");
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to fetch ticket details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketData();
    }, [id, activeOrg]);

    // Handle Status Update
    const handleStatusChange = async (newStatus: "Open" | "In Progress" | "Resolved") => {
        if (!ticket || !activeOrg?._id) return;
        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.put(
                `/tickets/${ticket._id}?orgId=${activeOrg._id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTicket(res.data.ticket);
            setSuccessMsg(`Status updated to "${newStatus}"`);
            setTimeout(() => setSuccessMsg(""), 3000);
            fetchTicketData(); // Refresh timeline activity
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    // Handle Assignee Reassignment by Dept Lead / Admin
    const handleAssigneeChange = async (newUserId: string) => {
        if (!ticket || !activeOrg?._id) return;
        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.put(
                `/tickets/${ticket._id}?orgId=${activeOrg._id}`,
                { assignedTo: newUserId || null },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTicket(res.data.ticket);
            setSuccessMsg(newUserId ? "Ticket reassigned successfully" : "Ticket unassigned");
            setTimeout(() => setSuccessMsg(""), 3000);
            fetchTicketData(); // Refresh timeline activity
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to reassign ticket");
        } finally {
            setUpdating(false);
        }
    };

    // File selection to Base64
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            if (file.size > 2 * 1024 * 1024) {
                alert(`File ${file.name} exceeds 2MB limit.`);
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setAttachedFiles((prev) => [
                    ...prev,
                    { name: file.name, url: reader.result as string, fileType: file.type }
                ]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    // Remove attached file draft
    const handleRemoveFile = (index: number) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const [generatingAIDraft, setGeneratingAIDraft] = useState(false);

    // AI Draft Solution Generator
    const handleAIDraftSolution = async () => {
        if (!ticket) return;
        setGeneratingAIDraft(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.post(
                "/ai/draft-solution",
                {
                    title: ticket.title,
                    description: ticket.description,
                    priority: ticket.priority,
                    departmentName: ticket.department?.name || "Support"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.solutionDraft) {
                setNewComment(res.data.solutionDraft);
            }
        } catch (err) {
            console.error("AI Draft Error:", err);
        } finally {
            setGeneratingAIDraft(false);
        }
    };

    // Post Comment
    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() && attachedFiles.length === 0) return;
        if (!id || !activeOrg?._id) return;

        setSubmittingComment(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.post(
                `/comments/${id}`,
                {
                    message: newComment,
                    attachments: attachedFiles,
                    isInternal: isInternalNote,
                    orgId: activeOrg._id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments((prev) => [...prev, res.data.comment]);
            setNewComment("");
            setAttachedFiles([]);
            setIsInternalNote(false);
            setSuccessMsg("Comment added successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
            fetchTicketData(); // Refresh activity log
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to post comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "??";

    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Live SLA Countdown Calculation
    const calculateSLA = () => {
        if (!ticket) return { text: "N/A", status: "normal" };
        const createdAt = new Date(ticket.createdAt).getTime();
        let targetMs = 24 * 60 * 60 * 1000;
        if (ticket.priority === "High") targetMs = 4 * 60 * 60 * 1000;
        if (ticket.priority === "Low") targetMs = 48 * 60 * 60 * 1000;

        if (ticket.status === "Resolved") {
            return { text: "✅ SLA Met (Resolved)", status: "success" };
        }

        const deadline = createdAt + targetMs;
        const diffMs = deadline - currentTime;

        if (diffMs <= 0) {
            const breachedMs = Math.abs(diffMs);
            const bHours = Math.floor(breachedMs / (1000 * 60 * 60));
            const bMins = Math.floor((breachedMs % (1000 * 60 * 60)) / (1000 * 60));
            return { text: `🚨 SLA Breached by ${bHours}h ${bMins}m`, status: "breached" };
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

        if (hours < 1) {
            return { text: `⚠️ SLA Warning: ${mins}m ${secs}s left`, status: "warning" };
        }
        return { text: `⏳ SLA Target: ${hours}h ${mins}m ${secs}s left`, status: "normal" };
    };

    const sla = calculateSLA();

    if (loading) {
        return (
            <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
                <Navbar />
                <div className="ml-64 p-10 flex flex-col items-center justify-center h-[80vh]">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-medium text-sm">Loading TMS Ticket...</p>
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
                <Navbar />
                <div className="ml-64 p-10">
                    <Topbar />
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6"
                    >
                        <ChevronLeft size={16} /> Back to Dashboard
                    </button>
                    <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg flex items-start gap-4">
                        <AlertCircle className="text-red-600 shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-base mb-1">Error Loading Ticket</h3>
                            <p className="text-sm">{error || "Ticket not found or access denied."}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
            <Navbar />
            <div className="ml-64 p-8">
                <Topbar />

                {/* Navigation Header */}
                <div className="mt-6 mb-4 flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="flex items-center text-xs text-slate-500 hover:text-blue-600 transition-colors mb-2 gap-1 font-medium"
                        >
                            <ChevronLeft size={14} /> Back to Dashboard
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                                TKT-{ticket._id.slice(-5).toUpperCase()}
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-[#172b4d]">
                                {ticket.title}
                            </h1>
                        </div>
                    </div>

                    {/* Status & SLA Badges */}
                    <div className="flex items-center gap-3">
                        {/* SLA Badge */}
                        <div className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border shadow-sm ${
                            sla.status === "breached"
                                ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                                : sla.status === "warning"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : sla.status === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                            <Flame size={14} className={sla.status === "breached" ? "text-red-600" : "text-amber-500"} />
                            <span>{sla.text}</span>
                        </div>

                        {/* Status Pill Badge */}
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border ${
                            ticket.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : ticket.status === "In Progress"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${
                                ticket.status === "Resolved" ? "bg-emerald-500" : ticket.status === "In Progress" ? "bg-amber-500" : "bg-blue-500"
                            }`} />
                            {ticket.status}
                        </span>
                    </div>
                </div>

                {/* Success Banner */}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 text-sm font-medium">
                        <CheckCircle2 className="text-green-600 shrink-0" size={18} />
                        {successMsg}
                    </div>
                )}

                {/* Main TMS Ticket View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left 2 Columns: Summary, Workflow, Comments & Audit Log */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Description Card */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Description
                            </h2>
                            <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-md border border-slate-100 min-h-[100px]">
                                {ticket.description || "No detailed description provided."}
                            </div>
                        </div>

                        {/* Workflow Actions Card */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                                Status Workflow Transition
                            </h2>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    disabled={updating || ticket.status === "Open"}
                                    onClick={() => handleStatusChange("Open")}
                                    className={`px-4 py-2 text-xs font-bold rounded border transition-all ${
                                        ticket.status === "Open"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                                    }`}
                                >
                                    Open
                                </button>

                                <ArrowRight size={14} className="text-slate-400" />

                                <button
                                    disabled={updating || ticket.status === "In Progress"}
                                    onClick={() => handleStatusChange("In Progress")}
                                    className={`px-4 py-2 text-xs font-bold rounded border transition-all ${
                                        ticket.status === "In Progress"
                                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                                    }`}
                                >
                                    In Progress
                                </button>

                                <ArrowRight size={14} className="text-slate-400" />

                                <button
                                    disabled={updating || ticket.status === "Resolved"}
                                    onClick={() => handleStatusChange("Resolved")}
                                    className={`px-4 py-2 text-xs font-bold rounded border transition-all ${
                                        ticket.status === "Resolved"
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                                    }`}
                                >
                                    Resolved
                                </button>
                            </div>
                        </div>

                        {/* Activity & Comments Tabbed Section */}
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            {/* Tab Header */}
                            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
                                <button
                                    onClick={() => setActiveTab("comments")}
                                    className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                                        activeTab === "comments"
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <MessageSquare size={16} />
                                    Comments & Internal Notes ({comments.length})
                                </button>

                                <button
                                    onClick={() => setActiveTab("activity")}
                                    className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                                        activeTab === "activity"
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <Activity size={16} />
                                    Audit Activity Trail ({activities.length})
                                </button>
                            </div>

                            {/* Tab Content: Comments */}
                            {activeTab === "comments" && (
                                <div className="p-6 space-y-6">
                                    {/* Add Comment Input Form */}
                                    <form onSubmit={handleAddComment} className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                {isInternalNote ? (
                                                    <span className="text-amber-700 flex items-center gap-1">
                                                        <Lock size={13} /> Add Internal Team Note (Hidden from client)
                                                    </span>
                                                ) : (
                                                    <span className="text-blue-700 flex items-center gap-1">
                                                        <MessageSquare size={13} /> Add Public Comment
                                                    </span>
                                                )}
                                            </span>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleAIDraftSolution}
                                                    disabled={generatingAIDraft}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded transition-all"
                                                >
                                                    <Wand2 size={12} className={generatingAIDraft ? "animate-spin" : ""} />
                                                    {generatingAIDraft ? "Drafting..." : "AI Draft Solution"}
                                                </button>

                                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isInternalNote}
                                                        onChange={(e) => setIsInternalNote(e.target.checked)}
                                                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    Internal Note
                                                </label>
                                            </div>
                                        </div>

                                        <textarea
                                            rows={3}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder={isInternalNote ? "Type an internal team update or handoff note..." : "Add a reply or update on this ticket..."}
                                            className="w-full bg-white border border-slate-300 rounded-md p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />

                                        {/* Attachment Files list */}
                                        {attachedFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {attachedFiles.map((file, idx) => (
                                                    <div key={idx} className="flex items-center gap-1.5 bg-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs">
                                                        <FileText size={13} />
                                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFile(idx)}
                                                            className="text-slate-500 hover:text-red-600 ml-1"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 cursor-pointer font-medium">
                                                <Paperclip size={14} />
                                                <span>Attach file (max 2MB)</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                            </label>

                                            <button
                                                type="submit"
                                                disabled={submittingComment || (!newComment.trim() && attachedFiles.length === 0)}
                                                className={`px-4 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 text-white transition-all ${
                                                    isInternalNote
                                                        ? "bg-amber-600 hover:bg-amber-700"
                                                        : "bg-blue-600 hover:bg-blue-700"
                                                } disabled:opacity-50`}
                                            >
                                                <Send size={13} />
                                                {submittingComment ? "Posting..." : isInternalNote ? "Post Note" : "Send Reply"}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Existing Comments List */}
                                    <div className="space-y-4">
                                        {comments.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400 text-xs">
                                                No comments yet. Start the discussion above.
                                            </div>
                                        ) : (
                                            comments.map((c) => (
                                                <div
                                                    key={c._id}
                                                    className={`p-4 rounded-lg border text-xs space-y-2 ${
                                                        c.isInternal
                                                            ? "bg-amber-50/60 border-amber-200"
                                                            : "bg-slate-50 border-slate-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                                                                {getInitials(c.senderId?.name)}
                                                            </div>
                                                            <span className="font-bold text-slate-800">{c.senderId?.name || "User"}</span>
                                                            {c.isInternal && (
                                                                <span className="bg-amber-200 text-amber-800 font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                    <Lock size={10} /> Internal Note
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-slate-400 text-[11px]">
                                                            {new Date(c.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                        {c.message}
                                                    </p>

                                                    {/* Attachments rendering */}
                                                    {c.attachments && c.attachments.length > 0 && (
                                                        <div className="pt-2 flex flex-wrap gap-2">
                                                            {c.attachments.map((att, attIdx) => (
                                                                <a
                                                                    key={attIdx}
                                                                    href={att.url}
                                                                    download={att.name}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-1.5 bg-white border border-slate-300 hover:border-blue-500 px-2.5 py-1 rounded text-[11px] text-blue-600 font-medium transition-colors shadow-xs"
                                                                >
                                                                    <Download size={12} />
                                                                    <span className="truncate max-w-[180px]">{att.name}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab Content: Activity Audit Trail */}
                            {activeTab === "activity" && (
                                <div className="p-6">
                                    {activities.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-xs">
                                            No activity logs recorded yet.
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                                            {activities.map((act) => (
                                                <div key={act._id} className="relative pl-6">
                                                    <div className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-blue-600 border-2 border-white" />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-slate-800">{act.user?.name || "System"}</span>{" "}
                                                        <span className="text-slate-600">{act.action}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                                        {new Date(act.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Ticket Meta & Assignment Controls */}
                    <div className="space-y-6">

                        {/* People & Assignment Box */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                                <span>People & Routing</span>
                                <Users size={16} className="text-slate-400" />
                            </h2>

                            {/* Assignee Selection (Department Lead Routing) */}
                            <div className="mb-5 pb-5 border-b border-slate-100">
                                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                                    <UserCheck size={14} className="text-blue-600" />
                                    Assignee (Dept Lead / Agent)
                                </label>

                                <div className="mb-3">
                                    {ticket.assignedTo ? (
                                        <div className="flex items-center gap-3 bg-blue-50/60 p-2.5 rounded border border-blue-100">
                                            <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                                                {getInitials(ticket.assignedTo.name)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{ticket.assignedTo.name}</div>
                                                <div className="text-xs text-slate-500">{ticket.assignedTo.email}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200 font-medium">
                                            Unassigned Lead
                                        </div>
                                    )}
                                </div>

                                {/* Reassignment Dropdown */}
                                <div>
                                    <span className="text-[11px] font-medium text-slate-500 block mb-1">
                                        Reassign to Team Member:
                                    </span>
                                    <select
                                        disabled={updating}
                                        value={ticket.assignedTo?._id || ""}
                                        onChange={(e) => handleAssigneeChange(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium focus:bg-white focus:border-blue-500 outline-none"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {members.map((m) => (
                                            <option key={m._id} value={m.user._id}>
                                                {m.user.name} ({m.department?.name || "General"} - {m.role.replace('_', ' ')})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Reporter Card */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                                    <UserPlus size={14} className="text-slate-400" />
                                    Reporter (Created By)
                                </label>
                                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                                    <div className="h-8 w-8 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs">
                                        {getInitials(ticket.createdBy?.name)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{ticket.createdBy?.name || "Unknown"}</div>
                                        <div className="text-xs text-slate-500">{ticket.createdBy?.email || "—"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Categorization Attributes */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>Details</span>
                                <Tag size={16} className="text-slate-400" />
                            </h2>

                            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                                <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                                    <Users size={14} /> Department
                                </span>
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                    {ticket.department?.name || "General"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                                <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                                    <ShieldAlert size={14} /> Priority
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded ${
                                    ticket.priority === "High"
                                        ? "bg-red-100 text-red-700"
                                        : ticket.priority === "Medium"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-700"
                                }`}>
                                    {ticket.priority}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs py-2">
                                <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                                    <Clock size={14} /> Created At
                                </span>
                                <span className="font-medium text-slate-600">
                                    {new Date(ticket.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}