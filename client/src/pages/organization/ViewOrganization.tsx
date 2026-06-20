import { useEffect, useState } from "react";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import Topbar from "../../components/Topbar";
import { useOrg } from "../../context/OrgContext";

export default function ViewOrganization() {
    const { activeOrg } = useOrg();

    const [organization, setOrganization] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        if (!activeOrg?._id) return;

        const fetchOrganization = async () => {
            try {
                const token = localStorage.getItem("token");

                const [orgRes, membersRes, deptRes] = await Promise.all([
                    api.get(`/orgs/${activeOrg._id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),

                    api.get(`/orgs/${activeOrg._id}/members`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),

                    api.get(`/departments/organization/${activeOrg._id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                ]);


                setOrganization(orgRes.data);
                setMembers(membersRes.data.members || []);
                setDepartments(deptRes.data || []);
                console.log("MEMBERS", membersRes.data);
                console.log("DEPARTMENTS", deptRes.data);
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
            "Are you sure you want to delete this organization? This action cannot be undone."
        );
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");
            await api.delete(`/orgs/${activeOrg._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Organization deleted successfully");
            window.location.href = "/dashboard";
        } catch (error: any) {
            console.error(error);
            alert(
                error?.response?.data?.message || "Failed to delete organization"
            );
        }
    };

    const generateInvite = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.post(
                `/orgs/${activeOrg._id}/invite`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInviteLink(res.data.link);
        } catch (error) {
            console.error(error);
            alert("Failed to generate invite link");
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const roleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-700 ring-purple-200";
            case "manager":
                return "bg-blue-100 text-blue-700 ring-blue-200";
            case "member":
                return "bg-green-100 text-green-700 ring-green-200";
            default:
                return "bg-gray-100 text-gray-700 ring-gray-200";
        }
    };
    const membersWithDepartments = members.map((member) => {

        return {
            ...member,
            department: member.department || null
        };

    });


    const filteredMembers = membersWithDepartments.filter((member) => {
        const name = member.user?.name?.toLowerCase() || "";

        const email = member.user?.email?.toLowerCase() || "";
        const dept = member.department?.name?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return name.includes(term) || email.includes(term) || dept.includes(term);
    });

    if (loading) {

        return (
            <div className="bg-slate-100 min-h-screen">
                <Navbar />
                <div className="ml-64 p-8">
                    <Topbar />
                    <div className="flex items-center justify-center h-96">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-500">Loading organization...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f4f5f7] min-h-screen">
            <Navbar />
            <div className="ml-64 p-6">
                <Topbar />

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 mt-4">
                    <span className="hover:text-blue-600 cursor-pointer">Organizations</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-800 font-medium">{organization?.name}</span>
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                                    {organization?.name?.charAt(0)?.toUpperCase() || "O"}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        {organization?.name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-gray-500">
                                            Created {new Date(organization?.createdAt).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-200">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowInvite(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Invite Members
                                </button>
                                <button
                                    onClick={handleDeleteOrganization}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-red-600 text-sm font-medium rounded-md border border-red-200 hover:bg-red-50 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100">
                        <div className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Members</p>
                                    <p className="text-2xl font-semibold text-gray-900">{members.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Departments</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {departments.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Your Role</p>

                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset capitalize mt-1 ${roleBadgeColor(
                                            organization?.myRole
                                        )}`}
                                    >
                                        {organization?.myRole || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {members.length}
                                </span>
                            </div>
                            <div className="relative">
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 relative left-15">
                                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <p className="text-sm text-gray-500">No members found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                                                        {getInitials(member.user?.name || "U")}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {member.user?.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                {member.user?.email}
                                            </td>
                                            <td className="py-4 px-6">
                                                {member.department?.name ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200">
                                                        {member.department.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${roleBadgeColor(member.role)}`}>
                                                    {member.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-[480px] mx-4">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Invite Team Members</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Generate a shareable link for your team
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowInvite(false);
                                    setInviteLink("");
                                }}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            {!inviteLink ? (
                                <div className="flex flex-col items-center py-6">
                                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-500 text-center mb-6">
                                        Click below to create an invitation link. Anyone with this link can join your organization.
                                    </p>
                                    <button
                                        onClick={generateInvite}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        Generate Invite Link
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Share this link
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={inviteLink}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(inviteLink);
                                                alert("Link copied to clipboard");
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                            </svg>
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        This link expires after one use.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowInvite(false);
                                    setInviteLink("");
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}