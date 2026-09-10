import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import api from "../api/axios";
import { useOrg } from "../context/OrgContext";
import {
    Zap,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Send,
    Save,
    Radio,
    Shield,
    Globe
} from "lucide-react";

interface IntegrationItem {
    _id?: string;
    platform: "discord" | "whatsapp" | "salesforce" | "custom_webhook";
    webhookUrl: string;
    enabled: boolean;
    events: string[];
}

export default function Integrations() {
    const { activeOrg } = useOrg();

    const [integrations, setIntegrations] = useState<Record<string, IntegrationItem>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
    const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");

    const fetchIntegrations = async () => {
        if (!activeOrg?._id) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`/integrations?orgId=${activeOrg._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const map: Record<string, IntegrationItem> = {};
            (res.data || []).forEach((item: IntegrationItem) => {
                map[item.platform] = item;
            });
            setIntegrations(map);
        } catch (err) {
            console.error("Failed to load integrations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntegrations();
    }, [activeOrg]);

    const handleUrlChange = (platform: string, url: string) => {
        setIntegrations((prev) => ({
            ...prev,
            [platform]: {
                ...(prev[platform] || {
                    platform: platform as any,
                    enabled: true,
                    events: ["ticket_created", "high_priority_alert", "status_updated", "sla_breached"]
                }),
                webhookUrl: url
            }
        }));
    };

    const handleToggle = (platform: string, enabled: boolean) => {
        setIntegrations((prev) => ({
            ...prev,
            [platform]: {
                ...(prev[platform] || {
                    platform: platform as any,
                    webhookUrl: "",
                    events: ["ticket_created", "high_priority_alert", "status_updated", "sla_breached"]
                }),
                enabled
            }
        }));
    };

    const handleSave = async (platform: string) => {
        const item = integrations[platform];
        if (!item?.webhookUrl?.trim() || !activeOrg?._id) {
            setErrorMsg(`Please enter a valid Webhook URL for ${platform.toUpperCase()}`);
            setTimeout(() => setErrorMsg(""), 3000);
            return;
        }

        setSavingPlatform(platform);
        setErrorMsg("");
        try {
            const token = localStorage.getItem("token");
            await api.post(
                "/integrations",
                {
                    orgId: activeOrg._id,
                    platform: item.platform,
                    webhookUrl: item.webhookUrl,
                    enabled: item.enabled,
                    events: item.events
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setActionMsg(`Successfully connected & saved ${platform.toUpperCase()} integration!`);
            setTimeout(() => setActionMsg(""), 3000);
            fetchIntegrations();
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.response?.data?.message || `Failed to save ${platform.toUpperCase()} integration`);
        } finally {
            setSavingPlatform(null);
        }
    };

    const handleTest = async (platform: string) => {
        const item = integrations[platform];
        if (!item?.webhookUrl?.trim()) {
            setErrorMsg(`Please enter a Webhook URL before testing ${platform.toUpperCase()}`);
            setTimeout(() => setErrorMsg(""), 3000);
            return;
        }

        setTestingPlatform(platform);
        setErrorMsg("");
        try {
            const token = localStorage.getItem("token");
            const res = await api.post(
                "/integrations/test",
                {
                    orgId: activeOrg?._id,
                    platform: item.platform,
                    webhookUrl: item.webhookUrl
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setActionMsg(res.data.message || `Test trigger payload sent to ${platform.toUpperCase()}!`);
            setTimeout(() => setActionMsg(""), 4000);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.response?.data?.message || "Failed to send test payload");
        } finally {
            setTestingPlatform(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
                <Navbar />
                <div className="ml-64 p-10 flex flex-col items-center justify-center h-[80vh]">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-medium text-sm">Loading App Integrations & Webhook Hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
            <Navbar />

            <div className="ml-64 p-8">
                <Topbar />

                {/* Header */}
                <div className="mt-8 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight text-[#172b4d] flex items-center gap-2.5">
                            <Zap className="text-amber-500" size={28} />
                            App Integrations & Webhook Hub
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Connect TMS with third-party apps like <span className="font-semibold text-slate-800">Discord, WhatsApp, Salesforce CRM, and Custom Webhooks</span> to send automated real-time alerts.
                    </p>
                </div>

                {/* Notifications */}
                {actionMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 text-sm font-medium shadow-sm">
                        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                        {actionMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800 text-sm font-medium shadow-sm">
                        <AlertCircle size={18} className="text-red-600 shrink-0" />
                        {errorMsg}
                    </div>
                )}

                {/* CONNECTOR CARDS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. DISCORD CONNECTOR */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold shadow-xs">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        Discord Channel Bot Webhook
                                        {integrations.discord?.enabled && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Active</span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-500">Post rich embed alerts to Discord channels on ticket events.</p>
                                </div>
                            </div>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={integrations.discord?.enabled ?? true}
                                    onChange={(e) => handleToggle("discord", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 relative" />
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Discord Webhook URL</label>
                            <input
                                type="text"
                                value={integrations.discord?.webhookUrl || ""}
                                onChange={(e) => handleUrlChange("discord", e.target.value)}
                                placeholder="https://discord.com/api/webhooks/12345678/abcxyz..."
                                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:bg-white focus:border-indigo-500 outline-none font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => handleTest("discord")}
                                disabled={testingPlatform === "discord"}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Send size={12} />
                                {testingPlatform === "discord" ? "Sending Test..." : "🧪 Send Test Trigger"}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSave("discord")}
                                disabled={savingPlatform === "discord"}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                            >
                                <Save size={12} />
                                {savingPlatform === "discord" ? "Saving..." : "Save Connector"}
                            </button>
                        </div>
                    </div>

                    {/* 2. WHATSAPP CONNECTOR */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold shadow-xs">
                                    <Radio size={24} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        WhatsApp / SMS Mobile Webhook
                                        {integrations.whatsapp?.enabled && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Active</span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-500">Send mobile text alerts via Twilio/WATI WhatsApp gateway.</p>
                                </div>
                            </div>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={integrations.whatsapp?.enabled ?? true}
                                    onChange={(e) => handleToggle("whatsapp", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative" />
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Gateway Webhook URL</label>
                            <input
                                type="text"
                                value={integrations.whatsapp?.webhookUrl || ""}
                                onChange={(e) => handleUrlChange("whatsapp", e.target.value)}
                                placeholder="https://api.twilio.com/2010-04-01/Accounts/... or WATI endpoint"
                                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 outline-none font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => handleTest("whatsapp")}
                                disabled={testingPlatform === "whatsapp"}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Send size={12} />
                                {testingPlatform === "whatsapp" ? "Sending Test..." : "🧪 Send Test Trigger"}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSave("whatsapp")}
                                disabled={savingPlatform === "whatsapp"}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                            >
                                <Save size={12} />
                                {savingPlatform === "whatsapp" ? "Saving..." : "Save Connector"}
                            </button>
                        </div>
                    </div>

                    {/* 3. SALESFORCE CRM CONNECTOR */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center font-bold shadow-xs">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        Salesforce / CRM Webhook Sync
                                        {integrations.salesforce?.enabled && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Active</span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-500">Sync ticket data into Salesforce cases & customer accounts.</p>
                                </div>
                            </div>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={integrations.salesforce?.enabled ?? true}
                                    onChange={(e) => handleToggle("salesforce", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600 relative" />
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Salesforce Rest Endpoint / Webhook URL</label>
                            <input
                                type="text"
                                value={integrations.salesforce?.webhookUrl || ""}
                                onChange={(e) => handleUrlChange("salesforce", e.target.value)}
                                placeholder="https://yourinstance.salesforce.com/services/apexrest/TMSConnector..."
                                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:bg-white focus:border-sky-500 outline-none font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => handleTest("salesforce")}
                                disabled={testingPlatform === "salesforce"}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Send size={12} />
                                {testingPlatform === "salesforce" ? "Sending Test..." : "🧪 Send Test Trigger"}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSave("salesforce")}
                                disabled={savingPlatform === "salesforce"}
                                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                            >
                                <Save size={12} />
                                {savingPlatform === "salesforce" ? "Saving..." : "Save Connector"}
                            </button>
                        </div>
                    </div>

                    {/* 4. CUSTOM WEBHOOK CONNECTOR */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold shadow-xs">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        Custom Webhook Connector (Zapier / Make)
                                        {integrations.custom_webhook?.enabled && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Active</span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-500">Send custom JSON HTTP POST payloads to Zapier or custom APIs.</p>
                                </div>
                            </div>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={integrations.custom_webhook?.enabled ?? true}
                                    onChange={(e) => handleToggle("custom_webhook", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 relative" />
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Custom Webhook Target URL</label>
                            <input
                                type="text"
                                value={integrations.custom_webhook?.webhookUrl || ""}
                                onChange={(e) => handleUrlChange("custom_webhook", e.target.value)}
                                placeholder="https://hooks.zapier.com/hooks/catch/... or custom API endpoint"
                                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:bg-white focus:border-amber-500 outline-none font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => handleTest("custom_webhook")}
                                disabled={testingPlatform === "custom_webhook"}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Send size={12} />
                                {testingPlatform === "custom_webhook" ? "Sending Test..." : "🧪 Send Test Trigger"}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSave("custom_webhook")}
                                disabled={savingPlatform === "custom_webhook"}
                                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                            >
                                <Save size={12} />
                                {savingPlatform === "custom_webhook" ? "Saving..." : "Save Connector"}
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
