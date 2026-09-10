const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// CORS setup - dynamically reflect request origin to support credentials across local and production domains
app.use(cors({
    origin: (origin, callback) => {
        // Always reflect requesting origin or allow non-browser requests
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Error:", err));

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const orgRoutes = require("./routes/orgRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const commentRoutes = require("./routes/commentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const integrationRoutes = require("./routes/integrationRoutes");

app.use("/api/invitations", invitationRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/integrations", integrationRoutes);

// Production Static Client Serving (for single-server deployments e.g., Render / Railway / Heroku)
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "TMS Backend API is healthy", timestamp: new Date() });
});

// SPA fallback for non-API routes in production (Express 5 compatible)
app.use((req, res) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
        return res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
            if (err) {
                res.status(200).send("Ticket Management System API Running. Build client to view UI.");
            }
        });
    }
    res.status(404).json({ error: "API Route Not Found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});