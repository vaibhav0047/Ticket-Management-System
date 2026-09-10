const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    console.log(`📧 [EMAIL AUTOMATION] Sending email to: ${to} | Subject: "${subject}"`);
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️ [EMAIL AUTOMATION] Warning: EMAIL_USER or EMAIL_PASS not set in .env");
            return;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `TMS Portal <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`✅ [EMAIL AUTOMATION] Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    } catch (err) {
        console.error(`❌ [EMAIL AUTOMATION ERROR] Failed to deliver email to ${to}:`, err.message);
    }
};

module.exports = sendEmail;