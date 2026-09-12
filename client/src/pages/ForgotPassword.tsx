import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email) {
            setMessage("Please enter your email address");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            await api.post("/auth/forgot-password", { email });

            setMessage("OTP sent to your email. Redirecting...");

            setTimeout(() => {
                navigate("/verify-reset-otp", {
                    state: { email }
                });
            }, 2000);

        } catch (err: any) {
            setMessage(
                err.response?.data?.message ||
                "Failed to send OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8">
                {/* Back Button */}
                <Link
                    to="/login"
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
                >
                    <ArrowLeft size={20} />
                    Back to Login
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="text-blue-600" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Forgot Password?
                    </h1>
                    <p className="text-slate-500 mt-2">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            autoComplete="email"
                            className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes("sent") || message.includes("Redirecting")
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                        {loading ? "Sending OTP..." : "Send Reset OTP"}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-slate-500 text-sm">
                        Remember your password?{" "}
                        <Link
                            to="/login"
                            className="text-blue-600 font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;