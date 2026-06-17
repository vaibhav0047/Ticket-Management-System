import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Member {
    email: string;
    department: string;
    role: string;
}

export default function CreateOrganization() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        industry: "",
        companySize: "",
        website: "",
        description: "",
    });

    const [departments, setDepartments] = useState<string[]>([
        "IT Support",
    ]);

    const [members, setMembers] = useState<Member[]>([]);

    const [loading, setLoading] = useState(false);

    const addDepartment = () => {
        setDepartments([...departments, ""]);
    };

    const updateDepartment = (
        index: number,
        value: string
    ) => {
        const updated = [...departments];
        updated[index] = value;
        setDepartments(updated);
    };

    const removeDepartment = (index: number) => {
        setDepartments(
            departments.filter((_, i) => i !== index)
        );
    };

    const addMember = () => {
        setMembers([
            ...members,
            {
                email: "",
                department: departments[0] || "",
                role: "user",
            },
        ]);
    };

    const updateMember = (
        index: number,
        field: keyof Member,
        value: string
    ) => {
        const updated = [...members];

        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        setMembers(updated);
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            await axios.post(
                "/api/orgs",
                {
                    ...formData,
                    departments,
                    members,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert(
                "Organization setup completed successfully"
            );

            navigate("/dashboard");
        } catch (error: any) {
            console.error(error);

            alert(
                error?.response?.data?.message ||
                "Failed to create organization"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-8">
                <h1 className="text-3xl font-bold">
                    Add Your Organization
                </h1>

                <p className="text-gray-500 mt-2">
                    Connect your company, create departments,
                    and invite team members.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-8 mt-8"
                >
                    {/* Organization Details */}

                    <div>
                        <h2 className="text-xl font-semibold mb-4">
                            Organization Details
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="Organization Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className="border rounded-lg p-3"
                                required
                            />

                            <input
                                placeholder="Website"
                                value={formData.website}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        website: e.target.value,
                                    })
                                }
                                className="border rounded-lg p-3"
                            />

                            <select
                                value={formData.industry}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        industry: e.target.value,
                                    })
                                }
                                className="border rounded-lg p-3"
                                required
                            >
                                <option value="">
                                    Select Industry
                                </option>
                                <option value="Technology">
                                    Technology
                                </option>
                                <option value="Banking">
                                    Banking
                                </option>
                                <option value="Healthcare">
                                    Healthcare
                                </option>
                                <option value="Education">
                                    Education
                                </option>
                            </select>

                            <select
                                value={formData.companySize}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        companySize:
                                            e.target.value,
                                    })
                                }
                                className="border rounded-lg p-3"
                                required
                            >
                                <option value="">
                                    Company Size
                                </option>
                                <option value="1-10 Employees">
                                    1-10 Employees
                                </option>
                                <option value="11-50 Employees">
                                    11-50 Employees
                                </option>
                                <option value="51-200 Employees">
                                    51-200 Employees
                                </option>
                                <option value="200+ Employees">
                                    200+ Employees
                                </option>
                            </select>
                        </div>

                        <textarea
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description:
                                        e.target.value,
                                })
                            }
                            className="border rounded-lg p-3 w-full mt-4"
                            rows={4}
                        />
                    </div>

                    {/* Departments */}

                    <div>
                        <h2 className="text-xl font-semibold mb-4">
                            Departments
                        </h2>

                        {departments.map(
                            (dept, index) => (
                                <div
                                    key={index}
                                    className="flex gap-3 mb-3"
                                >
                                    <input
                                        value={dept}
                                        onChange={(e) =>
                                            updateDepartment(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        className="border rounded-lg p-3 flex-1"
                                    />

                                    {departments.length >
                                        1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeDepartment(
                                                        index
                                                    )
                                                }
                                                className="px-4 bg-red-100 text-red-500 rounded-lg"
                                            >
                                                Remove
                                            </button>
                                        )}
                                </div>
                            )
                        )}

                        <button
                            type="button"
                            onClick={addDepartment}
                            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg"
                        >
                            + Add Department
                        </button>
                    </div>

                    {/* Members */}

                    <div>
                        <h2 className="text-xl font-semibold mb-4">
                            Invite Team Members
                        </h2>

                        {members.map(
                            (member, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-3 gap-4 mb-4"
                                >
                                    <input
                                        placeholder="Email"
                                        value={member.email}
                                        onChange={(e) =>
                                            updateMember(
                                                index,
                                                "email",
                                                e.target.value
                                            )
                                        }
                                        className="border rounded-lg p-3"
                                    />

                                    <select
                                        value={
                                            member.department
                                        }
                                        onChange={(e) =>
                                            updateMember(
                                                index,
                                                "department",
                                                e.target.value
                                            )
                                        }
                                        className="border rounded-lg p-3"
                                    >
                                        {departments.map(
                                            (
                                                dept,
                                                idx
                                            ) => (
                                                <option
                                                    key={
                                                        idx
                                                    }
                                                    value={
                                                        dept
                                                    }
                                                >
                                                    {dept}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <select
                                        value={member.role}
                                        onChange={(e) =>
                                            updateMember(
                                                index,
                                                "role",
                                                e.target.value
                                            )
                                        }
                                        className="border rounded-lg p-3"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="lead">Lead</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                            )
                        )}

                        <button
                            type="button"
                            onClick={addMember}
                            className="bg-green-100 text-green-600 px-4 py-2 rounded-lg"
                        >
                            + Add Member
                        </button>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                            className="border px-5 py-3 rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-50"
                        >
                            {loading
                                ? "Creating..."
                                : "Setup Organization"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}