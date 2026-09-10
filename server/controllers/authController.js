const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PendingUser = require("../models/PendingUser");
const otpGenerator = require("otp-generator");
const sendEmail = require("../utils/sendEmail");


/**
 * REGISTER USER (SEND OTP)
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // remove old pending requests
        await PendingUser.deleteMany({ email });

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true
        });

        await PendingUser.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000
        });

        console.log(`🔑 [OTP AUTOMATION] Registration OTP generated for ${email}: ${otp}`);

        await sendEmail(
            email,
            "[TMS] Account Verification OTP",
            `
            <div style="font-family: Arial, sans-serif; max-width:550px; margin:auto; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
                <h2 style="color:#0052cc; margin-top:0;">Ticket Management System (TMS)</h2>
                <p style="font-size:14px; color:#4a5568;">Your account verification OTP code is:</p>
                <div style="background-color:#ebf8ff; color:#2b6cb0; border:1px border-blue-200; font-size:28px; font-weight:bold; letter-spacing:4px; text-align:center; padding:15px; border-radius:6px; margin:15px 0;">
                    ${otp}
                </div>
                <p style="font-size:12px; color:#718096;">This code is valid for 5 minutes. Do not share this code with anyone.</p>
            </div>
            `
        );

        return res.status(200).json({
            message: "OTP sent successfully"
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({
            message: "Server error during registration",
            error: err.message
        });
    }
};


/**
 * VERIFY OTP (CREATE USER)
 */
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const pendingUser = await PendingUser.findOne({ email });

        if (!pendingUser) {
            return res.status(404).json({
                message: "No pending registration found"
            });
        }

        if (pendingUser.otp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (Date.now() > pendingUser.otpExpiry) {
            return res.status(400).json({
                message: "OTP expired"
            });
        }

        const userCount = await User.countDocuments();

        const user = await User.create({

            name: pendingUser.name,

            email: pendingUser.email,

            password: pendingUser.password

        });

        await PendingUser.deleteMany({ email });

        return res.status(201).json({

            message: "Account created successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }

        });

    } catch (err) {
        console.error("VERIFY OTP ERROR:", err);
        res.status(500).json({
            message: err.message
        });
    }
};


/**
 * LOGIN USER
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email

            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({
            message: "Server error during login",
            error: err.message
        });
    }
};


/**
 * FORGOT PASSWORD (SEND OTP)
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true
        });

        user.resetOtp = otp;
        user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        console.log(`🔑 [OTP AUTOMATION] Password Reset OTP generated for ${email}: ${otp}`);

        await sendEmail(
            email,
            "[TMS] Password Reset OTP",
            `
            <div style="font-family: Arial, sans-serif; max-width:550px; margin:auto; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
                <h2 style="color:#0052cc; margin-top:0;">Ticket Management System (TMS)</h2>
                <p style="font-size:14px; color:#4a5568;">Your password reset OTP code is:</p>
                <div style="background-color:#fff5f5; color:#c53030; border:1px border-red-200; font-size:28px; font-weight:bold; letter-spacing:4px; text-align:center; padding:15px; border-radius:6px; margin:15px 0;">
                    ${otp}
                </div>
                <p style="font-size:12px; color:#718096;">This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
            </div>
            `
        );

        return res.json({
            message: "OTP sent for password reset"
        });

    } catch (err) {
        console.error("FORGOT PASSWORD ERROR:", err);
        res.status(500).json({
            message: err.message
        });
    }
};
exports.verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({
                message: "No reset request found"
            });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (Date.now() > user.resetOtpExpiry) {
            return res.status(400).json({
                message: "OTP expired"
            });
        }

        return res.status(200).json({
            message: "OTP verified successfully"
        });

    } catch (err) {
        console.error("VERIFY RESET OTP ERROR:", err);
        return res.status(500).json({
            message: err.message
        });
    }
};

/**
 * RESET PASSWORD
 */
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (Date.now() > user.resetOtpExpiry) {
            return res.status(400).json({
                message: "OTP expired"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);

        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;

        await user.save();

        return res.json({
            message: "Password reset successful"
        });

    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);
        res.status(500).json({
            message: err.message
        });
    }
};