const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    console.log(`📧 Attempting to send email to: ${to} | Subject: "${subject}"`);
    try {
        const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
        // Automatically strip spaces from Gmail App Passwords (e.g. "drxe cnze yhkj dtlg" -> "drxecnzeyhkjdtlg")
        const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "").trim() : "";

        if (!user || !pass) {
            console.warn("⚠️ Warning: EMAIL_USER or EMAIL_PASS not configured in environment variables");
            return;
        }

        // Use direct SMTP on Port 465 (SSL) for cloud hosting compatibility (Render / Railway / AWS)
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user, pass }
        });

        const info = await transporter.sendMail({
            from: `TMS Portal <${user}>`,
            to,
            subject,
            html
        });

        console.log(`✅ Email delivered successfully to ${to} (Message ID: ${info.messageId})`);
        return info;
    } catch (err) {
        console.error(`❌ Email delivery failure to ${to}:`, err.message);
    }
};

module.exports = sendEmail;