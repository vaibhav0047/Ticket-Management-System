const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️ Warning: EMAIL_USER or EMAIL_PASS not set in .env");
            return;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `TMS Portal <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`✅ Email sent successfully to ${to}`);
    } catch (err) {
        console.error(`❌ Failed to send email to ${to}:`, err.message);
    }
};

module.exports = sendEmail;