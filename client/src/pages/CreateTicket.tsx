import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ChevronLeft,

    Layout,
    Send,
    ShieldAlert,
    Users
} from "lucide-react";

export default function CreateTicket() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Medium",
        department: "IT",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/tickets/create", form);
            navigate("/dashboard");
        } catch (err) {
            console.error("Failed to create ticket:", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D] font-sans p-6">
            {/* Header / Breadcrumbs */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2"
                    >
                        <ChevronLeft size={16} />
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-semibold tracking-tight">Create Ticket</h1>
                </div>
                <div className="hidden md:block">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold uppercase">New Request</span>
                </div>
            </div>

            <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8">
                    {/* TITLE SECTION */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Summary <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            name="title"
                            placeholder="e.g., Cannot access VPN"
                            onChange={handleChange}
                            className="w-full border-2 border-slate-200 bg-slate-50 p-2.5 rounded focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
                        />
                        <p className="mt-1 text-[11px] text-slate-500 italic">Summarize the issue in one sentence.</p>
                    </div>

                    {/* TWO COLUMN ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* PRIORITY */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                                <ShieldAlert size={14} className="text-slate-400" />
                                Priority
                            </label>
                            <select
                                name="priority"
                                onChange={handleChange}
                                value={form.priority}
                                className="w-full border-2 border-slate-200 bg-slate-50 p-2.5 rounded focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-medium"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent / Blocker</option>
                            </select>
                        </div>

                        {/* DEPARTMENT */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                                <Users size={14} className="text-slate-400" />
                                Assigned Department
                            </label>
                            <select
                                name="department"
                                onChange={handleChange}
                                value={form.department}
                                className="w-full border-2 border-slate-200 bg-slate-50 p-2.5 rounded focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-medium"
                            >
                                <option value="IT">IT Infrastructure</option>
                                <option value="HR">Human Resources</option>
                                <option value="Finance">Finance & Payroll</option>
                                <option value="Support">Customer Success</option>
                            </select>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Description
                        </label>
                        <div className="relative">
                            <textarea
                                name="description"
                                placeholder="Please provide steps to reproduce or specific error messages..."
                                onChange={handleChange}
                                className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded h-40 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm leading-relaxed"
                            />
                            <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none">
                                <Layout size={40} />
                            </div>
                        </div>
                    </div>

                    {/* INFO BOX */}
                    <div className="flex items-start gap-3 bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r">
                        <AlertCircle className="text-blue-600 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm text-blue-800 font-medium">Standard SLA applies</p>
                            <p className="text-xs text-blue-600 mt-0.5">Tickets are usually responded to within 4 business hours.</p>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded transition-all"
                        >
                            Cancel
                        </button>
                        <button className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white px-6 py-2 rounded font-semibold text-sm transition-all shadow-md active:scale-95">
                            <Send size={14} />
                            Create Ticket
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}