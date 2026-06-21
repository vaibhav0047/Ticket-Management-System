import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { useOrg } from "../context/OrgContext";
import { Search, Shield, Briefcase, Mail, Save, MoreHorizontal, UserPlus } from "lucide-react";

interface Member {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    department?: {
        _id: string;
        name: string;
    } | null;
    role: string;
    designation?: string;
}

const designationMap: any = {
    "Engineering Team": ["Engineering Manager", "Tech Lead", "Senior Software Engineer", "Software Engineer", "Backend Engineer", "Frontend Engineer", "Full Stack Developer", "QA Engineer", "DevOps Engineer"],
    "Product Team": ["Product Manager", "Associate Product Manager", "Product Owner", "Business Analyst", "Product Analyst"],
    "Support Team": ["Support Manager", "Customer Success Manager", "Support Engineer", "Technical Support Engineer"],
    "Sales Team": ["Sales Manager", "Account Executive", "Business Development Executive", "Sales Associate"],
    "Design Team": ["Design Lead", "UI Designer", "UX Designer", "Product Designer", "Visual Designer"]
};

export default function Users() {
    const [currentUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
    const [members, setMembers] = useState<Member[]>([]);
    const { activeOrg } = useOrg();
    const [searchTerm, setSearchTerm] = useState("");

    const myMembership = members.find((m) => m.user._id === currentUser.id);
    const canEdit = ["owner", "org_admin"].includes(myMembership?.role || "");

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`/orgs/${activeOrg?._id}/members`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMembers(res.data.members || []);
        } catch (err) {
            console.error(err);
        }
    };

    const updateMember = async (id: string, role: string, designation: string) => {
        try {
            const token = localStorage.getItem("token");
            await api.put(`/users/${id}`, { role, designation }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchMembers();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (activeOrg?._id) fetchMembers();
    }, [activeOrg]);

    const filteredMembers = members.filter(m =>
        m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
            <Navbar />
            <div className="ml-64 p-10">
                <Topbar />

                <div className="mt-8 mb-6 flex justify-between items-end">
                    <div>
                        <nav className="text-xs text-gray-500 mb-2 flex gap-2">
                            <span>Organizations</span> / <span>{activeOrg?.name || 'Settings'}</span> / <span className="text-gray-900 font-medium">Users</span>
                        </nav>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#172b4d]">
                            Users
                        </h1>
                    </div>
                    <button className="bg-[#0052cc] hover:bg-[#0747a6] text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors">
                        <UserPlus size={18} />
                        Invite users
                    </button>
                </div>

                <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                    {/* Controls Bar */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Find a user..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-sm transition-all"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            {filteredMembers.length} users
                        </div>
                    </div>

                    {/* Enterprise Table */}
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">User</th>
                                <th className="px-6 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Department</th>
                                <th className="px-6 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Job Title</th>
                                <th className="px-6 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Organization Role</th>
                                {canEdit && <th className="px-6 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredMembers.map((member) => (
                                <MemberRow
                                    key={member._id}
                                    member={member}
                                    canEdit={canEdit}
                                    updateMember={updateMember}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MemberRow({ member, canEdit, updateMember }: { member: Member; canEdit: boolean; updateMember: (id: string, role: string, designation: string) => void }) {
    const [role, setRole] = useState(member.role);
    const [designation, setDesignation] = useState(member.designation || "");
    const availableDesignations = designationMap[member.department?.name || ""] || [];

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <tr className="hover:bg-blue-50/40 transition-colors group">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-[#deebff] text-[#0747a6] rounded-full flex items-center justify-center font-bold text-xs border border-blue-100">
                        {getInitials(member.user.name)}
                    </div>
                    <div>
                        <div className="font-medium text-[#172b4d]">{member.user.name}</div>
                        <div className="text-xs text-gray-500">{member.user.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-gray-600">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {member.department?.name || "Unassigned"}
                </span>
            </td>
            <td className="px-6 py-4">
                {canEdit ? (
                    <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Select Title</option>
                        {availableDesignations.map((title: string) => (
                            <option key={title} value={title}>{title}</option>
                        ))}
                    </select>
                ) : (
                    <div className="text-gray-600 text-sm">{member.designation || "—"}</div>
                )}
            </td>
            <td className="px-6 py-4">
                {canEdit ? (
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        <option value="owner">Owner</option>
                        <option value="org_admin">Administrator</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                    </select>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#ebecf0] text-[#42526e] text-[11px] font-bold uppercase w-fit tracking-tighter">
                        <Shield size={12} /> {member.role.replace('_', ' ')}
                    </div>
                )}
            </td>
            {canEdit && (
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => updateMember(member._id, role, designation)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors title='Save changes'"
                        >
                            <Save size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    );
}