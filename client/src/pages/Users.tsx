import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const isAdmin = currentUser.role === "admin";

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(
                "http://localhost:5000/api/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const updateUser = async (
        id: string,
        role: string,
        department: string
    ) => {
        try {
            const token = localStorage.getItem("token");

            await axios.put(
                `http://localhost:5000/api/users/${id}`,
                {
                    role,
                    department
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            fetchUsers();
        } catch (err) {
            console.error("Failed to update user:", err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="bg-slate-100 min-h-screen">
            <Navbar />

            <div className="ml-64 p-8">
                <Topbar />

                <h1 className="text-4xl font-bold mt-8 mb-8">
                    Users Management
                </h1>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left p-4">Name</th>
                                <th className="text-left p-4">Email</th>
                                <th className="text-left p-4">Department</th>
                                <th className="text-left p-4">Role</th>
                                <th className="text-left p-4">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user) => (
                                <UserRow
                                    key={user._id}
                                    user={user}
                                    updateUser={updateUser}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

interface UserRowProps {
    user: User;
    updateUser: (id: string, role: string, department: string) => void;
    isAdmin: boolean;
}

function UserRow({ user, updateUser, isAdmin }: UserRowProps) {
    const [role, setRole] = useState(user.role);
    const [department, setDepartment] = useState(
        user.department || "Engineering"
    );

    return (
        <tr className="border-t">
            <td className="p-4">{user.name}</td>

            <td className="p-4">{user.email}</td>

            <td className="p-4">
                <select
                    disabled={!isAdmin}
                    value={department}
                    onChange={(e) =>
                        setDepartment(e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 disabled:bg-gray-100"
                >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="IT Support">IT Support</option>
                </select>
            </td>

            <td className="p-4">
                <select
                    disabled={!isAdmin}
                    value={role}
                    onChange={(e) =>
                        setRole(e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 disabled:bg-gray-100"
                >
                    <option value="user">User</option>
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                </select>
            </td>

            <td className="p-4">
                {isAdmin && (
                    <button
                        onClick={() =>
                            updateUser(
                                user._id,
                                role,
                                department
                            )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Save
                    </button>
                )}
            </td>
        </tr>
    );
}