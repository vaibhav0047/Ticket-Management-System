import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ChevronLeft,
    Layout,
    Send,
    ShieldAlert,
    Users,
    CheckCircle,
    X,
    Sparkles,
    Wand2
} from "lucide-react";
import { useOrg } from "../context/OrgContext";

interface Department {
    _id: string;
    name: string;
    orgId: string;
}

interface TicketForm {
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High";
    departmentId: string;
}

export default function CreateTicket() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<Department[]>([]);
    const { activeOrg } = useOrg();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // AI suggestion state
    const [analyzingAI, setAnalyzingAI] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<{
        priority: "Low" | "Medium" | "High";
        suggestedDepartmentName: string;
        reasoning: string;
    } | null>(null);

    const [form, setForm] = useState<TicketForm>({
        title: "",
        description: "",
        priority: "Medium",
        departmentId: "",
    });

    // Fetch user's organization departments
    useEffect(() => {
        if (!activeOrg?._id) return;

        const fetchDepartments = async () => {
            try {
                const res = await api.get(
                    `/departments/organization/${activeOrg._id}`
                );
                setDepartments(res.data);
            } catch (err) {
                console.error("Failed to fetch departments:", err);
                setError("Failed to load departments");
            }
        };

        fetchDepartments();
    }, [activeOrg]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // AI Classification Trigger
    const handleAISuggestion = async () => {
        if (!form.title.trim() && !form.description.trim()) {
            setError("Please enter a summary or description for AI analysis");
            return;
        }

        setAnalyzingAI(true);
        setError("");
        try {
            const res = await api.post("/ai/suggest", {
                title: form.title,
                description: form.description
            });

            const data = res.data;
            setAiSuggestion(data);

            // Auto-apply priority
            if (data.priority) {
                setForm((prev) => ({ ...prev, priority: data.priority }));
            }

            // Auto-apply matching department if found
            if (data.suggestedDepartmentName && departments.length > 0) {
                const matched = departments.find(
                    (d) => d.name.toLowerCase().includes(data.suggestedDepartmentName.toLowerCase()) ||
                           data.suggestedDepartmentName.toLowerCase().includes(d.name.toLowerCase())
                );
                if (matched) {
                    setForm((prev) => ({ ...prev, departmentId: matched._id }));
                }
            }
        } catch (err: any) {
            console.error("AI Error:", err);
        } finally {
            setAnalyzingAI(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        if (!form.title.trim()) {
            setError("Title is required");
            setIsSubmitting(false);
            return;
        }

        if (!form.departmentId) {
            setError("Please select a department");
            setIsSubmitting(false);
            return;
        }

        try {
            await api.post("/tickets/create", {
                ...form,
                orgId: activeOrg?._id,
            });

            setSuccess(true);
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);

        } catch (err: any) {
            console.error("Failed to create ticket:", err);
            setError(err.response?.data?.message || "Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D] font-sans p-6">
            {/* Header */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium"
                    >
                        <ChevronLeft size={16} />
                        Back to Dashboard
                    </button>

                    <h1 className="text-2xl font-semibold tracking-tight">
                        Create Ticket
                    </h1>
                </div>

                {/* AI Assistant Banner trigger */}
                <button
                    type="button"
                    onClick={handleAISuggestion}
                    disabled={analyzingAI}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                    <Wand2 size={14} className={analyzingAI ? "animate-spin" : ""} />
                    {analyzingAI ? "AI Analyzing..." : "AI Auto-Classify"}
                </button>
            </div>

            <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                {/* Success Message */}
                {success && (
                    <div className="p-4 bg-green-50 border-b border-green-200">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-green-600" size={20} />
                            <p className="text-green-800 font-medium">
                                Ticket created successfully! Redirecting to dashboard...
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-red-600" size={20} />
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="text-red-400 hover:text-red-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* AI Suggestion Alert Banner */}
                {aiSuggestion && (
                    <div className="p-4 bg-indigo-50 border-b border-indigo-200 text-indigo-900 text-xs">
                        <div className="flex items-start gap-2.5">
                            <Sparkles className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                            <div>
                                <span className="font-bold block text-sm text-indigo-950">
                                    AI Smart Classification Applied ✨
                                </span>
                                <p className="mt-0.5 text-indigo-800 leading-relaxed">
                                    Suggested Priority: <strong className="font-bold">{aiSuggestion.priority}</strong> | Department Target: <strong className="font-bold">{aiSuggestion.suggestedDepartmentName}</strong>
                                </p>
                                <p className="mt-1 text-[11px] text-indigo-600 italic">
                                    "{aiSuggestion.reasoning}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8">
                    {/* TITLE */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-bold text-slate-700">
                                Summary <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAISuggestion}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                                <Sparkles size={12} /> Auto-suggest with AI
                            </button>
                        </div>

                        <input
                            required
                            name="title"
                            value={form.title}
                            placeholder="e.g., Cannot access VPN or database server"
                            onChange={handleChange}
                            className="w-full border-2 border-slate-200 bg-slate-50 p-2.5 rounded focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
                        />

                        <p className="mt-1 text-[11px] text-slate-500 italic">
                            Summarize the issue in one sentence.
                        </p>
                    </div>

                    {/* PRIORITY + DEPARTMENT */}
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
                            </select>
                        </div>

                        {/* DEPARTMENT */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                                <Users size={14} className="text-slate-400" />
                                Assigned Department
                            </label>

                            <select
                                name="departmentId"
                                onChange={handleChange}
                                value={form.departmentId}
                                required
                                className="w-full border-2 border-slate-200 bg-slate-50 p-2.5 rounded focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-medium"
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </option>
                                ))}
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
                                value={form.description}
                                placeholder="Please provide steps to reproduce or specific error messages..."
                                onChange={handleChange}
                                className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded h-40 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm leading-relaxed"
                            />
                            <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none">
                                <Layout size={40} />
                            </div>
                        </div>
                    </div>

                    {/* INFO / ROUTING PREVIEW */}
                    <div className="flex items-start gap-3 bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r">
                        <AlertCircle className="text-blue-600 mt-0.5 shrink-0" size={18} />
                        <div>
                            <p className="text-sm text-blue-900 font-semibold">
                                TMS Ticket Auto-Routing
                            </p>
                            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                                {form.departmentId ? (
                                    <>
                                        This ticket will automatically be assigned to the <strong className="font-semibold">{departments.find(d => d._id === form.departmentId)?.name}</strong> Department Lead for review and team distribution.
                                    </>
                                ) : (
                                    "Select a department to view automatic lead routing and SLA."
                                )}
                            </p>
                        </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded transition-all"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={!form.departmentId || isSubmitting || success}
                            className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0747A6] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-semibold text-sm transition-all shadow-md"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send size={14} />
                                    Create Ticket
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}