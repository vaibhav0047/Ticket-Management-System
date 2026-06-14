import {
    FaHome,
    FaTicketAlt,
    FaPlusCircle,
    FaUsers,
    FaChartBar,
    FaCog
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
    const location = useLocation();

    const navItems = [
        {
            name: "Dashboard",
            icon: <FaHome />,
            path: "/dashboard"
        },
        {
            name: "Tickets",
            icon: <FaTicketAlt />,
            path: "/tickets"
        },
        {
            name: "Create Ticket",
            icon: <FaPlusCircle />,
            path: "/create-ticket"
        },
        {
            name: "Users",
            icon: <FaUsers />,
            path: "/users"
        },
        {
            name: "Reports",
            icon: <FaChartBar />,
            path: "/reports"
        },
        {
            name: "Settings",
            icon: <FaCog />,
            path: "/settings"
        }
    ];

    return (
        <div className="w-64 h-screen bg-slate-950 text-white fixed">
            <div className="p-6 text-2xl font-bold border-b border-slate-800">
                Ticket System
            </div>

            <div className="p-4 flex flex-col gap-3">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`p-3 rounded-lg flex items-center gap-3 transition ${location.pathname === item.path
                                ? "bg-blue-600"
                                : "hover:bg-slate-800"
                            }`}
                    >
                        {item.icon}
                        {item.name}
                    </Link>
                ))}
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