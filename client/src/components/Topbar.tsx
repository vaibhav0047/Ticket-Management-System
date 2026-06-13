import { FaBell } from "react-icons/fa";

export default function Topbar() {
    return (
        <div className="h-16 bg-white rounded-xl shadow-sm flex items-center justify-between px-6">
            <input
                type="text"
                placeholder="Search tickets..."
                className="w-96 border border-gray-200 rounded-lg px-4 py-2"
            />

            <div className="flex items-center gap-5">
                <FaBell className="text-gray-500" />

                <div className="flex items-center gap-3">
                    <img
                        src="https://i.pravatar.cc/40"
                        className="rounded-full"
                    />
                    <div>
                        <p className="font-semibold">Vaibhav Verma</p>
                        <p className="text-xs text-gray-500">Admin</p>
                    </div>
                </div>
            </div>
        </div>
    );
}