require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Error:", err));

// Routes (models will be loaded when required by controllers)

const userRoutes = require("./routes/userRoutes");


const authRoutes = require("./routes/authRoutes");


const analyticsRoutes = require("./routes/analyticsRoutes");


const ticketRoutes = require("./routes/ticketRoutes");
const orgRoutes = require("./routes/orgRoutes");
const invitationRoutes =
    require("./routes/invitationRoutes");

app.use(
    "/api/invitations",
    invitationRoutes
);

app.use(
    "/api/orgs",
    orgRoutes
);


app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/", (_req, res) => {
    res.send("Backend Running");
});
app.listen(5000, () => {
    console.log("Server running on port 5000");
});