const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    console.log(`📧 [EMAIL AUTOMATION] Initiating email send to: ${to} | Subject: "${subject}"`);
    try {
        const rawUser = process.env.EMAIL_USER;
        const rawPass = process.env.EMAIL_PASS;

        if (!rawUser || !rawPass) {
            console.warn("⚠️ [EMAIL AUTOMATION] Warning: EMAIL_USER or EMAIL_PASS not set in environment variables");
            return;
        }

        const cleanUser = rawUser.trim();
        // Automatically strip spaces from Gmail App Passwords (e.g., "drxe cnze yhkj dtlg" -> "drxecnzeyhkjdtlg")
        const cleanPass = rawPass.replace(/\s+/g, "").trim();

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // TLS/SSL port 465
            auth: {
                user: cleanUser,
                pass: cleanPass
            }
        });

        const info = await transporter.sendMail({
            from: `TMS Portal <${cleanUser}>`,
            to,
            subject,
            html
        });
        console.log(`✅ [EMAIL AUTOMATION SUCCESS] Email sent successfully to ${to} (Message ID: ${info.messageId})`);
        return info;
    } catch (err) {
        console.error(`❌ [EMAIL AUTOMATION ERROR] Failed to deliver email to ${to}:`, err.message);
    }
};

module.exports = sendEmail;