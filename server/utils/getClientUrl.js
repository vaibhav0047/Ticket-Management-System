const getClientUrl = () => {
    if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes("localhost")) {
        return process.env.CLIENT_URL.replace(/\/$/, "");
    }
    if (process.env.NODE_ENV === "production") {
        return "https://ticket-management-system-bojr.onrender.com";
    }
    return "http://localhost:5173";
};

module.exports = getClientUrl;
