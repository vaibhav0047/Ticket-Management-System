import { useEffect, useState } from "react";
import api from "../api/axios";
import { useOrg } from "../context/OrgContext";
import {
    AlertTriangle,
    Info,
    Megaphone,
    X,
    Send,
    Flame
} from "lucide-react";

interface Announcement {
    _id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "outage";
    author?: {
        name: string;
        email: string;
    };
    createdAt: string;
}

export default function AnnouncementBanner() {
    const { activeOrg } = useOrg();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [userRole, setUserRole] = useState<string>("member");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: "",
        message: "",
        type: "info" as "info" | "warning" | "outage"
    });

    const fetchAnnouncements = async () => {
        if (!activeOrg?._id) return;
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [annRes, userRes] = await Promise.all([
                api.get(`/announcements?orgId=${activeOrg._id}`, { headers }),
                api.get(`/tickets?orgId=${activeOrg._id}&tab=all`, { headers }).catch(() => ({ data: { userRole: "member" } }))
            ]);

            setAnnouncements(annRes.data || []);
            setUserRole(userRes.data.userRole || "member");
        } catch (err) {
            console.error("Failed to load announcements:", err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [activeOrg]);

    const handleDismiss = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            await api.put(`/announcements/${id}/dismiss`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            console.error(err);
            setAnnouncements((prev) => prev.filter((a) => a._id !== id));
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim() || !activeOrg?._id) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.post(
                "/announcements",
                { ...form, orgId: activeOrg._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAnnouncements((prev) => [res.data.announcement, ...prev]);
            setShowModal(false);
            setForm({ title: "", message: "", type: "info" });
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to publish announcement");
        } finally {
            setSubmitting(false);
        }
    };

    const isLeadOrAdmin = ["owner", "org_admin", "department_manager", "team_lead"].includes(userRole);

    return (
        <div className="space-y-3 mb-6">
            {/* ANNOUNCEMENT BANNERS LIST */}
            {announcements.map((a) => (
                <div
                    key={a._id}
                    className={`p-4 rounded-lg border shadow-sm flex items-start justify-between gap-4 transition-all text-xs ${
                        a.type === "outage"
                            ? "bg-red-50 border-red-200 text-red-900"
                            : a.type === "warning"
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-blue-50 border-blue-200 text-blue-900"
                    }`}
                >
                    <div className="flex items-start gap-3">
                        {a.type === "outage" ? (
                            <Flame size={18} className="text-red-600 shrink-0 mt-0.5 animate-pulse" />
                        ) : a.type === "warning" ? (
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        )}

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-white/80 border shadow-xs">
                                    {a.type === "outage" ? "🚨 Outage Alert" : a.type === "warning" ? "⚠️ Maintenance Warning" : "📢 Announcement"}
                                </span>
                                <h3 className="font-bold text-sm text-slate-900">{a.title}</h3>
                            </div>
                            <p className="mt-1 text-slate-700 leading-relaxed">{a.message}</p>
                            <div className="mt-1.5 text-[10px] opacity-75 font-medium">
                                Broadcasted by {a.author?.name || "Workspace Lead"} • {new Date(a.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleDismiss(a._id)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-white/50 transition-colors"
                        title="Dismiss announcement"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}

            {/* BROADCAST ANNOUNCEMENT TRIGGER BUTTON FOR LEADS & ADMINS */}
            {isLeadOrAdmin && (
                <div className="flex items-center justify-end">
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <Megaphone size={14} className="text-blue-600" />
                        Broadcast System Announcement
                    </button>
                </div>
            )}

            {/* BROADCAST ANNOUNCEMENT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Megaphone size={20} className="text-blue-400" />
                                <h2 className="font-bold text-base">Broadcast System Incident Announcement</h2>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4 text-xs font-sans">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Announcement Type
                                </label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-semibold focus:border-blue-500 outline-none"
                                >
                                    <option value="info">📢 Info / Announcement</option>
                                    <option value="warning">⚠️ Maintenance Warning</option>
                                    <option value="outage">🚨 System Outage / Critical Incident</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Announcement Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g., Engineering Outage: DB Maintenance in Progress"
                                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Broadcast Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    placeholder="Describe the incident, impacted services, and estimated resolution timeline for workspace members..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-xs focus:border-blue-500 outline-none leading-relaxed"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !form.title.trim() || !form.message.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-bold flex items-center gap-1.5 shadow"
                                >
                                    <Send size={13} />
                                    {submitting ? "Publishing..." : "Broadcast Alert"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
