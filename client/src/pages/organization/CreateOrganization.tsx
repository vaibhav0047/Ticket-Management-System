import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Building2,
    Users,
    Plus,
    Trash2,
    ChevronLeft,
    Briefcase,
    Globe,
    Mail,
    ShieldCheck,
    Info,
    ArrowRight
} from "lucide-react";

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

    const [departments, setDepartments] = useState<string[]>(["IT Support"]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);

    const addDepartment = () => setDepartments([...departments, ""]);

    const updateDepartment = (index: number, value: string) => {
        const updated = [...departments];
        updated[index] = value;
        setDepartments(updated);
    };

    const removeDepartment = (index: number) => {
        setDepartments(departments.filter((_, i) => i !== index));
    };

    const addMember = () => {
        setMembers([...members, { email: "", department: departments[0] || "", role: "user" }]);
    };

    const updateMember = (index: number, field: keyof Member, value: string) => {
        const updated = [...members];
        updated[index] = { ...updated[index], [field]: value };
        setMembers(updated);
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            await axios.post("/api/orgs", { ...formData, departments, members }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            navigate("/dashboard");
        } catch (error: any) {
            console.error(error);
            alert(error?.response?.data?.message || "Failed to create organization");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D] font-sans pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Organization Setup</h1>
                            <p className="text-xs text-slate-500 font-medium">Configure your enterprise workspace</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate("/dashboard")} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded">
                            Cancel
                        </button>
                        <button
                            form="org-form"
                            type="submit"
                            disabled={loading}
                            className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-5 py-2 rounded font-semibold text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Complete Setup"}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto mt-8 px-4">
                <form id="org-form" onSubmit={handleSubmit} className="space-y-8">

                    {/* SECTION 1: CORE DETAILS */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <Building2 size={18} className="text-blue-600" />
                            <h2 className="font-bold text-slate-700">General Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Organization Name *</label>
                                <input
                                    required
                                    placeholder="Acme Corp"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border-2 border-slate-200 p-2.5 rounded focus:border-blue-500 outline-none text-sm transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Website URL</label>
                                <div className="relative">
                                    <Globe size={14} className="absolute left-3 top-3.5 text-slate-400" />
                                    <input
                                        placeholder="https://example.com"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full border-2 border-slate-200 pl-9 p-2.5 rounded focus:border-blue-500 outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Industry</label>
                                <select
                                    required
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full border-2 border-slate-200 p-2.5 rounded focus:border-blue-500 outline-none text-sm font-medium bg-white"
                                >
                                    <option value="">Select Sector</option>
                                    <optgroup label="Core Industries">
                                        <option value="Technology">Technology & Software</option>
                                        <option value="Financial Services">Banking & Financial Services</option>
                                        <option value="Healthcare">Healthcare & Life Sciences</option>
                                        <option value="Manufacturing">Manufacturing & Industrial</option>
                                    </optgroup>
                                    <optgroup label="Services & Retail">
                                        <option value="Retail">Retail & E-commerce</option>
                                        <option value="Professional Services">Professional Services (Consulting/Legal)</option>
                                        <option value="Education">Education & Higher Ed</option>
                                        <option value="Hospitality">Hospitality & Tourism</option>
                                    </optgroup>
                                    <optgroup label="Public & Infrastructure">
                                        <option value="Government">Government & Public Sector</option>
                                        <option value="Energy">Energy & Utilities</option>
                                        <option value="Telecommunications">Telecommunications</option>
                                        <option value="Logistics">Logistics & Transportation</option>
                                    </optgroup>
                                    <optgroup label="Specialized">
                                        <option value="Aerospace">Aerospace & Defense</option>
                                        <option value="Media">Media & Entertainment</option>
                                        <option value="Automotive">Automotive</option>
                                        <option value="Real Estate">Real Estate</option>
                                        <option value="Non-Profit">Non-Profit / NGO</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Company Size</label>
                                <select
                                    required
                                    value={formData.companySize}
                                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                                    className="w-full border-2 border-slate-200 p-2.5 rounded focus:border-blue-500 outline-none text-sm font-medium"
                                >
                                    <option value="">Select Scale</option>
                                    <option value="1-10 Employees">1-10 Employees</option>
                                    <option value="51-200 Employees">51-200 Employees</option>
                                    <option value="200+ Employees">200+ Employees</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">About the Organization</label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief mission statement or overview..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border-2 border-slate-200 p-3 rounded focus:border-blue-500 outline-none text-sm resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: DEPARTMENTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Briefcase size={18} className="text-slate-500" />
                                Departments
                            </h3>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                Define business units for ticket routing. Each department can have its own specific SLAs and queues.
                            </p>
                        </div>
                        <div className="lg:col-span-2 space-y-3">
                            {departments.map((dept, index) => (
                                <div key={index} className="flex gap-2 group">
                                    <input
                                        value={dept}
                                        onChange={(e) => updateDepartment(index, e.target.value)}
                                        className="flex-1 border-2 border-slate-200 p-2.5 rounded focus:border-blue-500 outline-none text-sm transition-all bg-white"
                                        placeholder="e.g. Technical Support"
                                    />
                                    {departments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeDepartment(index)}
                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addDepartment}
                                className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded text-slate-500 text-sm font-semibold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Add Another Department
                            </button>
                        </div>
                    </div>

                    {/* SECTION 3: MEMBERS */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-blue-600" />
                                <h2 className="font-bold text-slate-700">Team Invitations</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addMember}
                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-all flex items-center gap-1"
                            >
                                <Plus size={14} /> Invite Member
                            </button>
                        </div>

                        <div className="p-0 overflow-x-auto">
                            {members.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Mail className="mx-auto text-slate-200 mb-3" size={40} />
                                    <p className="text-sm text-slate-400">No members added yet. Invite your team to get started.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Email Address</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Department</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Role</th>
                                            <th className="px-6 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {members.map((member, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="email"
                                                        placeholder="name@company.com"
                                                        value={member.email}
                                                        onChange={(e) => updateMember(index, "email", e.target.value)}
                                                        className="w-full bg-transparent outline-none text-sm text-slate-700"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={member.department}
                                                        onChange={(e) => updateMember(index, "department", e.target.value)}
                                                        className="bg-transparent outline-none text-sm font-medium text-slate-600"
                                                    >
                                                        {departments.map((dept, idx) => (
                                                            <option key={idx} value={dept}>{dept || "Unnamed Dept"}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck size={14} className={member.role === 'admin' ? 'text-purple-500' : 'text-slate-400'} />
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => updateMember(index, "role", e.target.value)}
                                                            className="bg-transparent outline-none text-sm font-medium text-slate-600"
                                                        >
                                                            <option value="admin">Admin</option>
                                                            <option value="lead">Lead</option>
                                                            <option value="user">User</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => removeMember(index)} className="text-slate-300 hover:text-red-500">
                                                        <Plus size={18} className="rotate-45" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r flex items-start gap-3">
                        <Info size={18} className="text-blue-600 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>Note:</strong> Invitations will be sent immediately after organization creation. You can manage roles and permissions later in the <strong>Admin Console</strong>.
                        </p>
                    </div>
                </form>
            </main>
        </div>
    );
}