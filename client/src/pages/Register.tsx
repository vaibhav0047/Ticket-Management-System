import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { FaApple } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";



export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const passwordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special;

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

    if (!passwordValid) {
      alert("Password does not meet requirements");
      return;
    }

    if (formData.password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          ...formData,
          role: "user",
        }
      );

      alert("OTP sent to your email");

      navigate("/verify-otp", {
        state: {
          email: formData.email,
        },
      });
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center">
          Create Account
        </h1>

        <p className="text-center text-slate-500 mt-2 mb-6">
          Join the Ticket Management Platform
        </p>

        {/* Social Login */}
        <div className="space-y-3 mb-5">
          {/* Google OAuth temporarily disabled due to configuration issues */}

          <div className="mb-3 flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                console.log(
                  "Google Login Success",
                  credentialResponse
                );
              }}
              onError={() => {
                console.log("Google Login Failed");
              }}
            />
          </div>


          <button
            type="button"
            className="w-full border rounded-xl py-3 font-medium hover:bg-slate-50 flex items-center justify-center gap-3"
          >
            <FaApple size={22} />
            Continue with Apple
          </button>
        </div>

        <div className="relative flex items-center mb-5">
          <div className="flex-grow border-t"></div>
          <span className="mx-3 text-sm text-slate-400">
            OR
          </span>
          <div className="flex-grow border-t"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            className="w-full border rounded-xl p-3 mb-4"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className="w-full border rounded-xl p-3 mb-4"
            required
          />

          {/* Password */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              className="w-full border rounded-xl p-3 pr-12"
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-4 top-3"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            autoComplete="new-password"
            className="w-full border rounded-xl p-3 mb-4"
            required
          />

          {/* Password Rules */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm">
            <p
              className={
                passwordChecks.length
                  ? "text-green-600"
                  : "text-red-500"
              }
            >
              ✓ At least 8 characters
            </p>

            <p
              className={
                passwordChecks.uppercase
                  ? "text-green-600"
                  : "text-red-500"
              }
            >
              ✓ One uppercase letter
            </p>

            <p
              className={
                passwordChecks.lowercase
                  ? "text-green-600"
                  : "text-red-500"
              }
            >
              ✓ One lowercase letter
            </p>

            <p
              className={
                passwordChecks.number
                  ? "text-green-600"
                  : "text-red-500"
              }
            >
              ✓ One number
            </p>

            <p
              className={
                passwordChecks.special
                  ? "text-green-600"
                  : "text-red-500"
              }
            >
              ✓ One special character
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}