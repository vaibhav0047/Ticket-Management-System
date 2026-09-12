import { useState } from "react";
import api from "../api/axios";
import {
    useLocation,
    useNavigate
} from "react-router-dom";

function VerifyResetOtp() {
    const [otp, setOtp] = useState("");

    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email;

    const handleVerify = async () => {
        try {
            await api.post("/auth/verify-reset-otp", {
                email,
                otp
            });

            navigate("/reset-password", {
                state: {
                    email,
                    otp
                }
            });

        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Invalid OTP"
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-[400px]">
                <h1 className="text-2xl font-bold text-center mb-6">
                    Verify OTP
                </h1>

                <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) =>
                        setOtp(e.target.value)
                    }
                    className="w-full border p-3 rounded mb-4"
                />

                <button
                    onClick={handleVerify}
                    className="w-full bg-green-600 text-white py-3 rounded"
                >
                    Verify OTP
                </button>
            </div>
        </div>
    );
}
export default VerifyResetOtp;