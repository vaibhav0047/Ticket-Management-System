import {
    FaHome,
    FaTicketAlt,
    FaPlusCircle,
    FaUsers,
    FaChartBar,
    FaCog
} from "react-icons/fa";

export default function Navbar() {
    return (
        <div className="w-64 h-screen bg-slate-950 text-white fixed">
            <div className="p-6 text-2xl font-bold border-b border-slate-800">
                Ticket System
            </div>

            <div className="p-4 flex flex-col gap-3">
                <button className="bg-blue-600 p-3 rounded-lg text-left flex items-center gap-3">
                    <FaHome />
                    Dashboard
                </button>

                <button className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <FaTicketAlt />
                    Tickets
                </button>

                <button className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <FaPlusCircle />
                    Create Ticket
                </button>

                <button className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <FaUsers />
                    Users
                </button>

                <button className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <FaChartBar />
                    Reports
                </button>

                <button className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <FaCog />
                    Settings
                </button>
            </div>

            <div className="absolute bottom-6 left-4 right-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                    <p className="font-semibold">Admin User</p>
                    <p className="text-sm text-slate-400">
                        admin@tickets.com
                    </p>
                </div>
            </div>
        </div>
    );
}