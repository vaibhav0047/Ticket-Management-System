import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import TicketTrendChart from "../components/TicketTrendChart";
import TicketStatusChart from "../components/TicketStatusChart";

export default function Dashboard() {
    return (
        <div className="bg-slate-100 min-h-screen">
            <Navbar />

            <div className="ml-64 p-8">
                <Topbar />

                <h1 className="text-4xl font-bold mt-8">
                    Dashboard
                </h1>

                <p className="text-gray-500">
                    Welcome back, here's what's happening.
                </p>


                <div className="grid grid-cols-4 gap-6 mt-8">
                    {[
                        ["Total Tickets", "256"],
                        ["Resolved", "142"],
                        ["In Progress", "63"],
                        ["Open", "51"],
                    ].map(([title, value]) => (
                        <div
                            key={title}
                            className="bg-white rounded-xl p-6 shadow-sm"
                        >
                            <p className="text-gray-500">{title}</p>

                            <h2 className="text-4xl font-bold mt-2 text-black-500">
                                {value}
                            </h2>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-6 mt-8">
                    <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-black mb-4">
                            Ticket Trends
                        </h2>

                        <TicketTrendChart />
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-black mb-4">
                            Ticket Overview
                        </h2>

                        <TicketStatusChart />
                    </div>
                </div>

                <div className="bg-white rounded-xl mt-8 p-6 shadow-sm">
                    Recent Tickets Table
                </div>
            </div>
        </div>
    );
}