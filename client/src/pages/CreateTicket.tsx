import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function CreateTicket() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Medium",
        department: "IT",
    });

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        try {
            await api.post("/tickets/create", form);
            alert("Ticket created!");
            navigate("/dashboard");
        } catch (err) {
            console.log(err);
        }
    };

    // Priority colors
    const priorityColor = {
        Low: "text-green-600 bg-green-50 border-green-200",
        Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
        High: "text-red-600 bg-red-50 border-red-200",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg"
            >
                <h1 className="text-2xl font-bold mb-6 text-center">
                    Create New Ticket
                </h1>

                {/* TITLE */}
                <input
                    name="title"
                    placeholder="Ticket Title"
                    onChange={handleChange}
                    className="w-full border p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* DESCRIPTION */}
                <textarea
                    name="description"
                    placeholder="Describe your issue..."
                    onChange={handleChange}
                    className="w-full border p-3 rounded-xl mb-4 h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* PRIORITY */}
                <label className="block text-sm font-medium mb-2">
                    Priority
                </label>

                <select
                    name="priority"
                    onChange={handleChange}
                    value={form.priority}
                    className={`w-full border p-3 rounded-xl mb-4 font-semibold ${priorityColor[form.priority as keyof typeof priorityColor]}`}
                >
                    <option value="Low">🟢 Low Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="High">🔴 High Priority</option>
                </select>

                {/* DEPARTMENT */}
                <label className="block text-sm font-medium mb-2">
                    Department
                </label>

                <select
                    name="department"
                    onChange={handleChange}
                    value={form.department}
                    className="w-full border p-3 rounded-xl mb-6"
                >
                    <option value="IT">IT</option>
                    <option value="HR"> HR</option>
                    <option value="Finance"> Finance</option>
                    <option value="Support"> Support</option>
                </select>

                {/* BUTTON */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all">
                    Create Ticket
                </button>
            </form>
        </div>
    );
}