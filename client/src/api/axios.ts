import axios from "axios";

// Dynamically determine API base URL at runtime:
// 1. VITE_API_URL if set (and not pointing to localhost while live in browser)
// 2. Runtime browser origin check: if not on localhost/127.0.0.1, use `${window.location.origin}/api`
// 3. Fallback to "http://localhost:5000/api" for local development
const getBaseURL = () => {
    let envUrl = import.meta.env.VITE_API_URL;

    // Safeguard: If VITE_API_URL was accidentally set to localhost in Render env vars, ignore it on live production
    if (envUrl && typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1" && envUrl.includes("localhost")) {
            envUrl = undefined;
        }
    }

    if (envUrl) return envUrl;

    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
            return `${window.location.origin}/api`;
        }
    }

    return "http://localhost:5000/api";
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Automatically attach JWT authorization token to every outgoing request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;