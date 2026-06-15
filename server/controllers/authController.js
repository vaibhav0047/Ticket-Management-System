const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PendingUser = require("../models/PendingUser");
const otpGenerator = require("otp-generator");
const sendEmail = require("../utils/sendEmail");

/**
 * REGISTER USER
 */


console.log("User:", User);
console.log("findOne:", User.findOne);
console.log("keys:", Object.keys(User));
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // basic validation (prevents crashes)
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        // check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        await PendingUser.deleteOne({ email });

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
                message: "Pending registration not found"
            });
        }

        if (pendingUser.otp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (new Date() > pendingUser.otpExpiry) {
            return res.status(400).json({
                message: "OTP expired"
            });
        }

        const userCount = await User.countDocuments();

        const user = await User.create({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            role: userCount === 0 ? "admin" : "user",
            department: "Engineering"
        });

        await PendingUser.deleteOne({ email });

        return res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("VERIFY OTP ERROR:", err);

        return res.status(500).json({
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

        // validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // check JWT secret
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        // generate token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // response
        res.status(200).json({
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