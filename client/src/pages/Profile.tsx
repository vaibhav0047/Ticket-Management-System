import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import api from "../api/axios";
import { useOrg } from "../context/OrgContext";
import {
    User,
    Mail,
    Phone,
    FileText,
    Camera,
    Save,
    CheckCircle2,
    Shield,
    Building2,
    Sparkles,
    AlertCircle,
    Upload,
    Trash2,
    Users,
    Search,
    BadgeCheck
} from "lucide-react";

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    bio?: string;
}

interface MembershipInfo {
    _id: string;
    orgId?: {
        _id: string;
        name: string;
        industry?: string;
    };
    departmentId?: {
        _id: string;
        name: string;
    };
    role: string;
    designation?: string;
}

interface OrgMember {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        phone?: string;
    };
    department?: {
        _id: string;
        name: string;
    } | null;
    role: string;
    designation?: string;
}

const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya"
];

export default function Profile() {
    const { activeOrg } = useOrg();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [memberships, setMemberships] = useState<MembershipInfo[]>([]);
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [searchMember, setSearchMember] = useState("");

    const [form, setForm] = useState({
        name: "",
        phone: "",
        avatar: "",
        bio: ""
    });

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const profileRes = await api.get("/users/profile", { headers });
            const u = profileRes.data.user;
            setProfile(u);
            setMemberships(profileRes.data.memberships || []);
            setForm({
                name: u.name || "",
                phone: u.phone || "",
                avatar: u.avatar || "",
                bio: u.bio || ""
            });

            // Update local storage user details
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...stored, ...u }));

            // Fetch team members for the active organization
            if (activeOrg?._id) {
                const membersRes = await api.get(`/orgs/${activeOrg._id}/members`, { headers });
                setOrgMembers(membersRes.data.members || []);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [activeOrg]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // Handle File Upload, Auto-Resize to 300x300 thumbnail, & Convert to Base64
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError("Image size should be less than 10MB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please upload a valid image file (PNG, JPG, WebP)");
            return;
        }

        setError("");
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedBase64 = canvas.toDataURL("image/jpeg", 0.85);
                    setForm((prev) => ({
                        ...prev,
                        avatar: resizedBase64
                    }));
                    setSuccessMsg("Photo uploaded and optimized! Click 'Save Profile Details' to persist.");
                    setTimeout(() => setSuccessMsg(""), 3000);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSelectAvatar = (url: string) => {
        setForm({ ...form, avatar: url });
    };

    const handleRemoveAvatar = () => {
        setForm({ ...form, avatar: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const res = await api.put("/users/profile", form, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updated = res.data.user;
            setProfile(updated);
            setSuccessMsg("Profile details saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);

            // Update local storage
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "US";

    // Filter org members by search term
    const filteredMembers = useMemo(() => {
        if (!searchMember.trim()) return orgMembers;
        const q = searchMember.toLowerCase();
        return orgMembers.filter((m) => {
            const nameMatch = m.user?.name?.toLowerCase().includes(q);
            const emailMatch = m.user?.email?.toLowerCase().includes(q);
            const roleMatch = m.role?.toLowerCase().includes(q);
            const deptMatch = m.department?.name?.toLowerCase().includes(q);
            return nameMatch || emailMatch || roleMatch || deptMatch;
        });
    }, [orgMembers, searchMember]);

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case "owner":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "org_admin":
                return "bg-indigo-100 text-indigo-800 border-indigo-200";
            case "department_manager":
            case "team_lead":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "member":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    if (loading) {
        return (
            <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
                <Navbar />
                <div className="ml-64 p-10 flex flex-col items-center justify-center h-[80vh]">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-medium text-sm">Loading User Profile & Workspace Directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f4f5f7] min-h-screen font-sans text-[#172b4d]">
            <Navbar />
            <div className="ml-64 p-8">
                <Topbar />

                <div className="mt-8 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-[#172b4d]">
                        User Profile & Account Settings
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">
                        Manage your personal details, contact number, avatar photo upload, and view team roles & departments.
                    </p>
                </div>

                {/* Notifications */}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 text-sm font-medium">
                        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                        {successMsg}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800 text-sm font-medium">
                        <AlertCircle size={18} className="text-red-600 shrink-0" />
                        {error}
                    </div>
                )}

                {/* MAIN TOP SECTION: PROFILE CARD & EDIT FORM */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Avatar & User Summary Card */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                {form.avatar ? (
                                    <img
                                        src={form.avatar}
                                        alt="Avatar"
                                        className="w-28 h-28 rounded-full border-4 border-blue-100 object-cover shadow-sm"
                                    />
                                ) : (
                                    <div className="w-28 h-28 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-3xl border-4 border-blue-100 shadow-sm">
                                        {getInitials(profile?.name)}
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow border-2 border-white cursor-pointer transition-colors" title="Upload Photo">
                                    <Camera size={16} />
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>

                            <h2 className="text-lg font-bold text-[#172b4d]">{profile?.name}</h2>
                            <p className="text-xs text-slate-500">{profile?.email}</p>
                            {profile?.phone && (
                                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                                    <Phone size={12} /> {profile.phone}
                                </p>
                            )}

                            {/* UPLOAD & REMOVE BUTTONS */}
                            <div className="mt-4 w-full space-y-2">
                                <label className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded text-xs font-bold cursor-pointer transition-colors">
                                    <Upload size={14} />
                                    Upload Profile Photo
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                </label>

                                {form.avatar && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded text-xs font-semibold transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Remove Photo
                                    </button>
                                )}
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 w-full text-left">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                                    Or Choose Avatar Preset
                                </span>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {PRESET_AVATARS.map((url, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectAvatar(url)}
                                            className={`p-1 rounded-full border-2 transition-all ${
                                                form.avatar === url ? "border-blue-600 scale-110" : "border-transparent hover:border-slate-300"
                                            }`}
                                        >
                                            <img src={url} alt={`Preset ${i}`} className="w-8 h-8 rounded-full" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Logged-in User's Active Roles & Departments Card */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Building2 size={14} className="text-blue-600" />
                                My Assigned Roles & Departments
                            </h3>

                            {memberships.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">Not joined to any organization yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {memberships.map((m) => (
                                        <div key={m._id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
                                            <div className="font-bold text-slate-800 flex items-center justify-between">
                                                <span>{m.orgId?.name || "Organization"}</span>
                                                <BadgeCheck size={14} className="text-blue-600" />
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeStyle(m.role)}`}>
                                                    Role: {m.role.replace('_', ' ')}
                                                </span>
                                                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                                                    Dept: {m.departmentId?.name || "General"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right 2 Columns: Edit Profile Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
                            <h2 className="text-base font-bold text-[#172b4d] mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Sparkles size={18} className="text-blue-600" />
                                Edit Personal Information
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <User size={14} className="text-slate-400" />
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Alex Johnson"
                                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Email Address (Read-only) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Mail size={14} className="text-slate-400" />
                                        Email Address (Account ID)
                                    </label>
                                    <input
                                        disabled
                                        type="email"
                                        value={profile?.email || ""}
                                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded px-3 py-2 text-sm cursor-not-allowed"
                                    />
                                    <span className="text-[11px] text-slate-400 italic">Email is fixed to your authentication account.</span>
                                </div>

                                {/* Mobile Phone Number */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Phone size={14} className="text-slate-400" />
                                        Mobile Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. +1 (555) 019-2834"
                                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Upload Profile Picture Banner */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Camera size={14} className="text-slate-400" />
                                        Upload Profile Picture
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 transition-all text-center">
                                        <Upload size={24} className="text-blue-600 mb-1" />
                                        <span className="text-xs font-bold text-slate-700">Click to upload photo from your device</span>
                                        <span className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WebP images (max 10MB)</span>
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                </div>

                                {/* Bio / Personal Details */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <FileText size={14} className="text-slate-400" />
                                        Bio / Personal Summary
                                    </label>
                                    <textarea
                                        rows={4}
                                        name="bio"
                                        value={form.bio}
                                        onChange={handleChange}
                                        placeholder="Tell your team a bit about yourself, skills, or office hours..."
                                        className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all leading-relaxed"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#0052cc] hover:bg-[#0747a6] text-white px-6 py-2.5 rounded font-semibold text-sm flex items-center gap-2 shadow transition-all disabled:bg-slate-400"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Saving Profile...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save Profile Details
                                            </>
                                        )}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                </div>

                {/* DOWNSIDE: WORKSPACE PEOPLE DIRECTORY (ROLES & DEPARTMENTS FOR EACH MEMBER) */}
                <div className="mt-8 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-bold text-[#172b4d] flex items-center gap-2">
                                <Users size={20} className="text-blue-600" />
                                Workspace Directory — People, Roles & Departments
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Complete roster of members in <span className="font-semibold text-slate-800">{activeOrg?.name || "your workspace"}</span> with their assigned roles and departments.
                            </p>
                        </div>

                        {/* Search Filter input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                            <input
                                type="text"
                                value={searchMember}
                                onChange={(e) => setSearchMember(e.target.value)}
                                placeholder="Search people by name, role, dept..."
                                className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {filteredMembers.length === 0 ? (
                        <div className="py-10 text-center text-slate-500 text-xs bg-slate-50 rounded border border-dashed border-slate-200">
                            No team members found in directory matching "{searchMember}".
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMembers.map((m) => {
                                const uName = m.user?.name || "Unknown Member";
                                const uEmail = m.user?.email || "—";
                                const uAvatar = m.user?.avatar;
                                const uPhone = m.user?.phone;
                                const deptName = m.department?.name || "General";
                                const roleTitle = m.role.replace('_', ' ');

                                return (
                                    <div
                                        key={m._id}
                                        className="bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg p-4 transition-all hover:shadow-md flex flex-col justify-between"
                                    >
                                        <div className="flex items-start gap-3">
                                            {uAvatar ? (
                                                <img
                                                    src={uAvatar}
                                                    alt={uName}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center border-2 border-white shadow-xs shrink-0">
                                                    {getInitials(uName)}
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                                    {uName}
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                    <Mail size={12} className="shrink-0 text-slate-400" />
                                                    {uEmail}
                                                </p>
                                                {uPhone && (
                                                    <p className="text-[11px] text-blue-600 font-medium truncate flex items-center gap-1 mt-0.5">
                                                        <Phone size={11} className="shrink-0 text-blue-500" />
                                                        {uPhone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Role & Department Badges at the bottom of each member card */}
                                        <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                                            {/* Role Badge */}
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 ${getRoleBadgeStyle(m.role)}`}>
                                                <Shield size={12} />
                                                <span className="capitalize">{roleTitle}</span>
                                            </span>

                                            {/* Department Badge */}
                                            <span className="bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border border-slate-300">
                                                <Building2 size={12} className="text-slate-600" />
                                                <span>{deptName}</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
