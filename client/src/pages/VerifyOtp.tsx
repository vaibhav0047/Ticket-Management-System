import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            setLoading(true);

            const res = await api.post("/auth/verify-otp", {
                email,
                otp,
            });

            alert(res.data.message);

            navigate("/login");
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "OTP verification failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center">
                    Verify OTP
                </h1>

                <p className="text-center text-slate-500 mt-2 mb-6">
                    Enter the OTP sent to
                </p>

                <p className="text-center font-medium mb-6">
                    {email}
                </p>

                <form onSubmit={handleVerify}>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) =>
                            setOtp(e.target.value)
                        }
                        className="w-full border rounded-xl p-3 mb-5 text-center text-lg tracking-widest"
                        maxLength={6}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default VerifyOtp;