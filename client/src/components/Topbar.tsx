import { useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));

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

            <div className="flex items-center gap-5">
                <FaBell className="text-gray-500 text-lg cursor-pointer" />

                <div className="relative">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <img
                            src="https://i.pravatar.cc/40"
                            alt="Profile"
                            className="rounded-full w-10 h-10"
                        />

                        <div>
                            <p className="font-semibold">
                                {user?.name || "User"}
                            </p>

                            <p className="text-xs text-gray-500 capitalize">
                                {user?.role || "User"}
                            </p>
                        </div>
                    </div>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-50">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-500"
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