import { useState } from "react";
import api from "../api/axios";
import { useOrg } from "../context/OrgContext";
import {
    Sparkles,
    X,
    Send,
    Bot,
    User,
    Flame,
    Activity,
    Building2
} from "lucide-react";

interface ChatMessage {
    sender: "user" | "ai";
    text: string;
    timestamp: string;
}

export default function AICopilotDrawer() {
    const { activeOrg } = useOrg();

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: "ai",
            text: "Hello! I am your TMS AI Copilot 🤖. I can analyze ticket priority risks, summarize department queues, and check SLA bottlenecks. How can I assist you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    const handleSend = async (textToSend?: string) => {
        const messageText = textToSend || query;
        if (!messageText.trim() || !activeOrg?._id) return;

        const userMsg: ChatMessage = {
            sender: "user",
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setQuery("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await api.post(
                "/ai/copilot-query",
                { query: messageText, orgId: activeOrg._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const aiMsg: ChatMessage = {
                sender: "ai",
                text: res.data.reply || "Analysis complete.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "Sorry, I encountered an issue analyzing workspace tickets. Please try again.",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* FLOATING TRIGGER BUTTON */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/30 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
                    title="Open TMS AI Copilot"
                >
                    <div className="relative">
                        <Sparkles size={20} className="animate-pulse text-amber-300" />
                    </div>
                    <span className="text-xs font-extrabold pr-1 hidden sm:inline-block">TMS AI Copilot</span>
                </button>
            )}

            {/* AI COPILOT SLIDE-OVER DRAWER */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[550px] transition-all backdrop-blur-xl animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                    TMS AI Copilot <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-400/30">AI Active</span>
                                </h3>
                                <p className="text-[11px] text-slate-400">Workspace Intelligence Assistant</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Quick Suggestion Pills */}
                    <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
                        <button
                            onClick={() => handleSend("Show High Priority tickets")}
                            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 font-medium"
                        >
                            <Flame size={12} className="text-red-400" /> High Priority Risks
                        </button>

                        <button
                            onClick={() => handleSend("Give me workspace status summary")}
                            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 font-medium"
                        >
                            <Activity size={12} className="text-emerald-400" /> SLA Summary
                        </button>

                        <button
                            onClick={() => handleSend("Show Engineering tickets")}
                            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 font-medium"
                        >
                            <Building2 size={12} className="text-indigo-400" /> Dept Queue
                        </button>
                    </div>

                    {/* Chat Messages Roster */}
                    <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {m.sender === "ai" && (
                                    <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow">
                                        <Bot size={15} />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[80%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                                        m.sender === "user"
                                            ? "bg-blue-600 text-white font-medium rounded-tr-none"
                                            : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none"
                                    }`}
                                >
                                    {m.text}
                                    <div
                                        className={`text-[9px] mt-1 text-right ${
                                            m.sender === "user" ? "text-blue-200" : "text-slate-400"
                                        }`}
                                    >
                                        {m.timestamp}
                                    </div>
                                </div>

                                {m.sender === "user" && (
                                    <div className="h-7 w-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                                        <User size={15} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-2.5 justify-start items-center text-slate-400 text-xs">
                                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                                    <Bot size={15} />
                                </div>
                                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    Analyzing ticket database...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask TMS AI Copilot about workspace tickets..."
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 outline-none"
                        />

                        <button
                            disabled={loading || !query.trim()}
                            onClick={() => handleSend()}
                            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
