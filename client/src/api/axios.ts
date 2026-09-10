import axios from "axios";

// Dynamically determine API base URL:
// 1. VITE_API_URL environment variable if explicitly configured
// 2. "/api" relative path in production (same domain single-server hosting)
// 3. Fallback to "http://localhost:5000/api" for local dev
const baseURL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "production" ? "/api" : "http://localhost:5000/api");

const api = axios.create({
    baseURL,
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