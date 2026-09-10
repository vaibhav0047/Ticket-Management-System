import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle
} from "lucide-react";

export default function Login() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (error) setError("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", formData);
            const newToken = response.data.token;

            localStorage.setItem("token", newToken);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            // CHECK INVITATION AFTER LOGIN
            const inviteToken = localStorage.getItem("inviteToken");
            const inviteDepartment = localStorage.getItem("inviteDepartment");

            if (inviteToken) {
                await api.post(
                    `/invitations/accept/${inviteToken}`,
                    { departmentId: inviteDepartment },
                    { headers: { Authorization: `Bearer ${newToken}` } }
                );

                localStorage.removeItem("inviteToken");
                localStorage.removeItem("inviteDepartment");
            }

            // Redirect to dashboard
            navigate("/dashboard");

        } catch (err: any) {
            console.error("Login Error:", err);
            setError(
                err.response?.data?.message ||
                "Login failed. Please check your credentials and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4 font-sans text-[#172b4d]">

            {/* Centered Clean White Login Card */}
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-8 sm:p-10">

                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-12 w-12 bg-[#0052cc] text-white rounded-xl font-black text-xl tracking-wider shadow mb-4">
                        TMS
                    </div>
                    <h1 className="text-2xl font-bold text-[#172b4d] tracking-tight">
                        Ticket Management System Portal
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Enterprise Support & Role Portal Authentication
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 text-xs font-medium">
                        <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Email Field */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Mail size={14} className="text-[#0052cc]" />
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] text-slate-900 rounded-lg px-3.5 py-2.5 text-xs outline-none transition-all placeholder:text-slate-400 font-medium"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Lock size={14} className="text-[#0052cc]" />
                                Password
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-[11px] font-semibold text-[#0052cc] hover:underline transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] text-slate-900 rounded-lg pl-3.5 pr-10 py-2.5 text-xs outline-none transition-all placeholder:text-slate-400 font-medium"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white py-3 rounded-lg text-xs font-bold shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <span>Sign In to Portal</span>
                                <ArrowRight size={15} />
                            </>
                        )}
                    </button>

                </form>

                {/* Footer Register Link */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Don't have an account yet?{" "}
                        <Link
                            to="/register"
                            className="text-[#0052cc] font-bold hover:underline transition-colors ml-1"
                        >
                            Register Account
                        </Link>
                    </p>
                </div>

            </div>

        </div>
    );
}