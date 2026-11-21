import User from "../models/User.js";

export const seedDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: "admin" });
        if (!adminExists) {
            await User.create({
                name: "System Administrator",
                email: "admin@school.edu",
                password: "admin123",
                role: "admin",
            });
            console.log("\n=======================================================");
            console.log("  Default Admin Account Initialized:");
            console.log("  Email:    admin@school.edu");
            console.log("  Password: admin123");
            console.log("=======================================================\n");
        }
    } catch (err) {
        console.error("Error checking or seeding admin:", err.message);
    }
};

export default seedDefaultAdmin;
