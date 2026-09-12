/**
 * Dynamic resolution helper for Client Application URL.
 * Automatically resolves production domain (e.g. Render external URL or custom domain)
 * without breaking local development or relying on hardcoded localhost links in emails.
 */
const getClientUrl = (req = null) => {
    // 1. Explicit environment variable check (ignoring localhost if running in production)
    let url = process.env.CLIENT_URL || process.env.FRONTEND_URL;
    if (url && process.env.NODE_ENV === "production" && url.includes("localhost")) {
        url = null;
    }
    if (url) return url.replace(/\/$/, ""); // Strip trailing slash

    // 2. Render External URL environment variable automatically injected by Render platform
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
    }

    // 3. Infer from incoming HTTP request (if provided)
    if (req) {
        const host = req.get("host");
        const protocol = req.protocol || "https";
        if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
            return `${protocol}://${host}`;
        }
    }

    // 4. Production fallback for deployed Render app
    if (process.env.NODE_ENV === "production") {
        return "https://ticket-management-system-bojr.onrender.com";
    }

    // 5. Localhost fallback for local development
    return "http://localhost:5173";
};

module.exports = getClientUrl;
