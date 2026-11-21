import User from "../models/User.js";
import Student from "../models/Student.js";
import generateToken from "../utils/generateToken.js";

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/"
});

export const register = async (req, res) => {
    // Public self-registration is strictly disabled
    return res.status(403).json({
        message: "Self-registration is disabled. Staff and student accounts are provisioned exclusively by the Administrator.",
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email/Student ID and password are required"
        });
    }

    // Allow login by email OR studentId
    const user = await User.findOne({
        $or: [
            { email: email.toLowerCase() },
            { studentId: email }
        ]
    });

    if (!user) {
        return res.status(401).json({
            message: "Invalid email/Student ID or password"
        });
    }

    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
        return res.status(401).json({
            message: "Invalid email/Student ID or password"
        });
    }

    let studentProfile = null;
    if (user.role === "student") {
        studentProfile = await Student.findOne({
            $or: [{ email: user.email }, { studentId: user.studentId }]
        });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, getCookieOptions());

    res.json({
        message: "Login successful",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.studentId || (studentProfile ? studentProfile.studentId : undefined),
            studentProfile,
        }
    });
};

export const logout = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    });

    res.json({
        message: "Logout successful"
    });
};

export const getMe = async (req, res) => {
    let studentProfile = null;
    if (req.user.role === "student") {
        studentProfile = await Student.findOne({
            $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
        });
    }

    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            studentId: req.user.studentId || (studentProfile ? studentProfile.studentId : undefined),
            studentProfile,
            createdAt: req.user.createdAt,
        }
    });
};

export const updateProfile = async (req, res) => {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name.trim();
    await user.save();

    let studentProfile = null;
    if (user.role === "student") {
        const student = await Student.findOne({
            $or: [{ email: user.email }, { studentId: user.studentId }],
        });
        if (student) {
            if (name) {
                const parts = name.trim().split(" ");
                student.firstName = parts[0] || name;
                student.lastName = parts.slice(1).join(" ") || student.lastName;
            }
            if (phone) student.phone = phone;
            if (address) student.address = address;
            await student.save();
            studentProfile = student;
        }
    }

    res.json({
        message: "Profile updated successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.studentId,
            studentProfile,
        },
    });
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(400).json({ message: "Current password does not match" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
};
