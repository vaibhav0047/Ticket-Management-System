import { useEffect, useState } from "react";
import axios from "axios";

import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import TicketTrendChart from "../components/TicketTrendChart";
import TicketStatusChart from "../components/TicketStatusChart";

import { useOrg } from "../context/OrgContext";

export default function Dashboard() {
    const { activeOrg } = useOrg();

    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        inProgress: 0,
        open: 0,
    });

    useEffect(() => {
        if (!activeOrg) return;

        const fetchStats = async () => {
            try {
                const res = await axios.get(
                    `/api/tickets/stats?orgId=${activeOrg._id}`
                );

                setStats(res.data);
            } catch (err) {
                console.error("Failed to load stats:", err);
            }
        };

        fetchStats();
    }, [activeOrg]);

    return (
        <div className="bg-slate-100 min-h-screen">
            <Navbar />

            <div className="ml-64 p-8">
                <Topbar />

                <h1 className="text-4xl font-bold mt-8">
                    Dashboard
                </h1>

                <p className="text-gray-500">
                    Welcome back, here's what's happening in{" "}
                    <span className="font-semibold">
                        {activeOrg?.name || "your workspace"}
                    </span>
                </p>

                {/* STATS CARDS */}
                <div className="grid grid-cols-4 gap-6 mt-8">
                    {[
                        ["Total Tickets", stats.total],
                        ["Resolved", stats.resolved],
                        ["In Progress", stats.inProgress],
                        ["Open", stats.open],
                    ].map(([title, value]) => (
                        <div
                            key={title}
                            className="bg-white rounded-xl p-6 shadow-sm"
                        >
                            <p className="text-gray-500">{title}</p>

                            <h2 className="text-4xl font-bold mt-2">
                                {value}
                            </h2>
                        </div>
                    ))}
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-3 gap-6 mt-8">
                    <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-black mb-4">
                            Ticket Trends
                        </h2>

                        <TicketTrendChart orgId={activeOrg?._id} />
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-black mb-4">
                            Ticket Overview
                        </h2>

                        <TicketStatusChart orgId={activeOrg?._id} />
                    </div>
                </div>

                {/* RECENT TABLE */}
                <div className="bg-white rounded-xl mt-8 p-6 shadow-sm">
                    Recent Tickets Table
                </div>
            </div>
        </div>
    );
}