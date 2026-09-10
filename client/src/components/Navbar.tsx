import {
    LayoutDashboard,
    PlusCircle,
    Users,
    Building,
    Shield,
    User,
    FolderKanban,
    Zap
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));

    const navItems = [
        {
            name: "TMS Portals",
            icon: <LayoutDashboard size={18} />,
            path: "/dashboard"
        },
        {
            name: "Department Views",
            icon: <FolderKanban size={18} />,
            path: "/departments"
        },
        {
            name: "App Integrations",
            icon: <Zap size={18} />,
            path: "/integrations"
        },
        {
            name: "Create Ticket",
            icon: <PlusCircle size={18} />,
            path: "/create-ticket"
        },
        {
            name: "My Profile",
            icon: <User size={18} />,
            path: "/profile"
        },
        {
            name: "Team & Users",
            icon: <Users size={18} />,
            path: "/users"
        },
        {
            name: "Organization Details",
            icon: <Building size={18} />,
            path: "/organization/view"
        }
    ];

    return (
        <div className="w-64 h-screen bg-[#071325] text-slate-200 fixed left-0 top-0 z-40 flex flex-col justify-between border-r border-slate-800">
            <div>
                {/* Branding */}
                <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-600 text-white rounded flex items-center justify-center font-black text-sm tracking-wider shadow">
                        TMS
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-white tracking-tight">Ticket Portal</h2>
                        <p className="text-[10px] text-slate-400 font-medium">Enterprise Management</p>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="p-4 space-y-1.5">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`p-3 rounded-md flex items-center gap-3 font-medium text-xs transition-all ${
                                location.pathname === item.path
                                    ? "bg-blue-600 text-white font-semibold shadow"
                                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                            }`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Current User Badge */}
            <div className="p-4 border-t border-slate-800/80">
                <div
                    onClick={() => navigate("/profile")}
                    className="bg-slate-900/80 p-3 rounded-md border border-slate-800/60 flex items-center gap-3 cursor-pointer hover:bg-slate-800/80 transition-colors"
                >
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full border border-blue-600 object-cover" />
                    ) : (
                        <div className="h-8 w-8 bg-blue-950 text-blue-300 rounded-full flex items-center justify-center font-bold text-xs border border-blue-800">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                        </div>
                    )}
                    <div className="overflow-hidden">
                        <p className="font-semibold text-xs text-white truncate">{user.name || "User"}</p>
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <Shield size={10} className="text-blue-400" />
                            {user.email || "Active User"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}