import { useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import OrgSwitcher from "./OrgSwitcher";
import { useOrg } from "../context/OrgContext";

export default function Topbar() {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const { orgs } = useOrg();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="h-16 bg-white rounded-xl shadow-sm flex items-center justify-between px-6">
            <input
                type="text"
                placeholder="Search tickets..."
                className="w-96 border border-gray-200 rounded-lg px-4 py-2"
            />
            <div className="flex items-center gap-3">

                <OrgSwitcher />

                <button
                    onClick={() =>
                        navigate(
                            orgs.length === 0
                                ? "/organization/create"
                                : "/organization/view"
                        )
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                    {orgs.length === 0
                        ? "Create Organization"
                        : "View Organization"}
                </button>

            </div>

            <div className="flex items-center gap-5">
                <FaBell className="text-gray-500 text-lg cursor-pointer" />

                <div className="relative">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                            alt="Profile"
                            className="rounded-full w-10 h-10 border border-slate-200 object-cover"
                        />

                        <div>
                            <p className="font-semibold text-sm">
                                {user?.name || "User"}
                            </p>

                            <p className="text-xs text-gray-500 capitalize">
                                {user?.email || "Account"}
                            </p>
                        </div>
                    </div>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-50 overflow-hidden divide-y divide-gray-100">
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    navigate("/profile");
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                            >
                                My Profile
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm font-medium text-red-600 flex items-center gap-2"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}