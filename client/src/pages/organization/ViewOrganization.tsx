import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Topbar from "../../components/Topbar";
import { useOrg } from "../../context/OrgContext";

export default function ViewOrganization() {
    const { activeOrg } = useOrg();

    const [organization, setOrganization] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeOrg?._id) return;

        const fetchOrganization = async () => {
            try {
                const token = localStorage.getItem("token");

                const [orgRes, membersRes] = await Promise.all([
                    axios.get(
                        `/api/orgs/${activeOrg._id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                    axios.get(
                        `/api/orgs/${activeOrg._id}/members`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                ]);

                setOrganization(orgRes.data);
                setMembers(membersRes.data);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganization();
    }, [activeOrg]);

    const handleDeleteOrganization = async () => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this organization?"
        );

        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `/api/orgs/${activeOrg._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert("Organization deleted successfully");

            window.location.href = "/dashboard";

        } catch (error: any) {
            console.error(error);

            alert(
                error?.response?.data?.message ||
                "Failed to delete organization"
            );
        }
    };

    if (loading) {
        return (
            <div className="p-10">
                Loading organization...
            </div>
        );
    }

    return (
        <div className="bg-slate-100 min-h-screen">
            <Navbar />

            <div className="ml-64 p-8">
                <Topbar />

                <div className="bg-white rounded-xl p-8 shadow-sm mt-8">

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {organization?.name}
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Created on{" "}
                                {new Date(
                                    organization?.createdAt
                                ).toLocaleDateString()}
                            </p>
                        </div>

                        <button
                            onClick={handleDeleteOrganization}
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
                        >
                            Delete Organization
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-8">

                        <div className="bg-slate-50 rounded-xl p-5">
                            <p className="text-gray-500">
                                Total Members
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {members.length}
                            </h2>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5">
                            <p className="text-gray-500">
                                Departments
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {organization?.departmentCount || 0}
                            </h2>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5">
                            <p className="text-gray-500">
                                Organization Role
                            </p>

                            <h2 className="text-3xl font-bold mt-2 capitalize">
                                Admin
                            </h2>
                        </div>

                    </div>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-sm mt-8">

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">
                            Organization Members
                        </h2>

                        <span className="text-gray-500">
                            {members.length} Members
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">

                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3">
                                        Name
                                    </th>

                                    <th className="text-left py-3">
                                        Email
                                    </th>

                                    <th className="text-left py-3">
                                        Department
                                    </th>

                                    <th className="text-left py-3">
                                        Role
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {members.map((member) => (
                                    <tr
                                        key={member._id}
                                        className="border-b"
                                    >
                                        <td className="py-4">
                                            {member.user?.name}
                                        </td>

                                        <td className="py-4">
                                            {member.user?.email}
                                        </td>

                                        <td className="py-4">
                                            {member.department?.name ||
                                                "-"}
                                        </td>

                                        <td className="py-4 capitalize">
                                            {member.role}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}