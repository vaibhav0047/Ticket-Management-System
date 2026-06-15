import { useState } from "react";
import axios from "axios";
import {
    useLocation,
    useNavigate
} from "react-router-dom";

function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email;
    const otp = location.state?.otp;

    const handleReset = async () => {
        if (password !== confirmPassword) {
            return alert("Passwords do not match");
        }

        try {
            await axios.post(
                "http://localhost:5000/api/auth/reset-password",
                {
                    email,
                    otp,
                    newPassword: password
                }
            );

            alert("Password Reset Successfully");

            navigate("/login");

        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Reset failed"
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-[400px]">
                <h1 className="text-2xl font-bold text-center mb-6">
                    Reset Password
                </h1>

                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    className="w-full border p-3 rounded mb-4"
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) =>
                        setConfirmPassword(
                            e.target.value
                        )
                    }
                    className="w-full border p-3 rounded mb-4"
                />

                <button
                    onClick={handleReset}
                    className="w-full bg-blue-600 text-white py-3 rounded"
                >
                    Reset Password
                </button>
            </div>
        </div>
    );
}
export default ResetPassword;