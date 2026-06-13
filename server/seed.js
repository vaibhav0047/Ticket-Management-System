const mongoose = require("mongoose");
const Ticket = require("./models/Ticket");

mongoose.connect(
    "mongodb+srv://vaibhavverma006:Shreya%3C3@vaibhav0047.yjc16vg.mongodb.net/sample_mflix?retryWrites=true&w=majority"
);

const tickets = [
    {
        title: "Production API returning 500 error",
        description: "All requests to /transactions endpoint are failing in production",
        category: "Backend",
        priority: "High",
        status: "Open",
    },
    {
        title: "CI/CD pipeline failing on merge",
        description: "GitHub Actions build fails after latest commit",
        category: "DevOps",
        priority: "High",
        status: "In Progress",
    },
    {
        title: "VPN authentication failure",
        description: "Employees unable to connect to internal VPN",
        category: "Security",
        priority: "High",
        status: "Open",
    },
    {
        title: "Dashboard not loading user data",
        description: "React dashboard shows blank screen after login",
        category: "Frontend",
        priority: "Medium",
        status: "In Progress",
    },
    {
        title: "MongoDB query timeout",
        description: "Aggregations on transactions collection are too slow",
        category: "Database",
        priority: "Medium",
        status: "Open",
    },
    {
        title: "Password reset email not received",
        description: "Users are not receiving OTP emails for reset",
        category: "Auth",
        priority: "Low",
        status: "Resolved",
    },
];

async function seed() {
    try {
        await Ticket.deleteMany({});
        await Ticket.insertMany(tickets);

        console.log("Seeded Successfully");
    } catch (err) {
        console.error("Seeding error:", err);
    } finally {
        process.exit();
    }
}

seed();