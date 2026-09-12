const getClientUrl = () => {
    if (process.env.CLIENT_URL) {
        let url = process.env.CLIENT_URL.trim().replace(/\/$/, "");
        if (process.env.NODE_ENV === "production" && url.includes("localhost")) {
            return "https://ticket-management-system-bojr.onrender.com";
        }
        return url;
    }

    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL.trim().replace(/\/$/, "");
    }

    if (process.env.NODE_ENV === "production") {
        return "https://ticket-management-system-bojr.onrender.com";
    }

    return "http://localhost:5173";
};

module.exports = getClientUrl;
