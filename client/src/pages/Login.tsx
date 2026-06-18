import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";


export default function Login() {

    const navigate = useNavigate();

    const [showPassword, setShowPassword] =
        useState(false);

    const [formData, setFormData] = useState({

        email: "",
        password: "",

    });

    const [loading, setLoading] =
        useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                formData
            );
            const newToken =
                response.data.token;
            localStorage.setItem(
                "token",
                newToken
            );
            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            // CHECK INVITATION AFTER LOGIN

            const inviteToken =
                localStorage.getItem("inviteToken");
            if (inviteToken) {
                await axios.post(
                    `http://localhost:5000/api/invitations/accept/${inviteToken}`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${newToken}`
                        }
                    }
                )
                // remove after joining

                localStorage.removeItem(
                    "inviteToken"
                );
            }

            // finally go dashboard
            navigate("/dashboard");

        } catch (err: any) {
            alert(

                err.response?.data?.message ||

                "Login Failed"

            );

        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-md w-[400px]"
            >
                <h1 className="text-3xl font-bold text-center mb-6">
                    Ticket System Login
                </h1>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border p-3 rounded mb-4"
                    required
                />
                <div className="relative mb-4">
                    <input
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }

                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full border p-3 rounded pr-10"
                        required
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(!showPassword)
                        }

                        className="absolute right-3 top-1/2 -translate-y-1/2"

                    >
                        {
                            showPassword
                                ? <EyeOff size={18} />
                                : <Eye size={18} />
                        }
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded"

                >
                    {
                        loading
                            ? "Logging In..."
                            : "Login"
                    }
                </button>

                <p className="text-center mt-4">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-blue-600"
                    >
                        Register

                    </Link>
                </p>

            </form>
        </div>

    );

}