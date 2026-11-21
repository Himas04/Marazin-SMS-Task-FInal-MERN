import User from "../models/User.js";

export const getStaffUsers = async (req, res) => {
    const staff = await User.find({ role: "staff" })
        .select("-password")
        .sort({ createdAt: -1 });

    res.json({ staff });
};

export const createStaffUser = async (req, res) => {
    const { name, email, password, department, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email, and password are required for staff",
        });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        return res.status(400).json({
            message: "A user with this email already exists",
        });
    }

    const newStaff = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: "staff",
        department: department || "Academic Faculty",
        phone: phone || "",
    });

    res.status(201).json({
        message: "Staff member created successfully",
        staff: {
            id: newStaff._id,
            name: newStaff.name,
            email: newStaff.email,
            role: newStaff.role,
            department: newStaff.department,
            phone: newStaff.phone,
            createdAt: newStaff.createdAt,
        },
    });
};

export const updateStaffUser = async (req, res) => {
    const { name, department, phone } = req.body;
    const staff = await User.findOne({ _id: req.params.id, role: "staff" });

    if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
    }

    if (name) staff.name = name;
    if (department !== undefined) staff.department = department;
    if (phone !== undefined) staff.phone = phone;

    await staff.save();

    res.json({
        message: "Staff details updated successfully",
        staff: {
            id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            department: staff.department,
            phone: staff.phone,
            createdAt: staff.createdAt,
        },
    });
};

export const resetStaffPassword = async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long",
        });
    }

    const staff = await User.findOne({ _id: req.params.id, role: "staff" });
    if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
    }

    staff.password = newPassword;
    await staff.save();

    res.json({
        message: `Password reset successfully for ${staff.name}`,
    });
};

export const deleteStaffUser = async (req, res) => {
    const staff = await User.findOneAndDelete({
        _id: req.params.id,
        role: "staff",
    });

    if (!staff) {
        return res.status(404).json({
            message: "Staff member not found",
        });
    }

    res.json({
        message: "Staff member account removed",
    });
};
