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

        await sendEmail(
            email,
            "Email Verification OTP",
            `
            <h2>Ticket Management System</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>Expires in 5 minutes.</p>
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
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
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

        await sendEmail(
            email,
            "Password Reset OTP",
            `
            <h2>Password Reset</h2>
            <h1>${otp}</h1>
            <p>Valid for 10 minutes</p>
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