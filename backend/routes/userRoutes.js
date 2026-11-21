import express from "express";
import {
    getStaffUsers,
    createStaffUser,
    updateStaffUser,
    resetStaffPassword,
    deleteStaffUser,
} from "../controllers/userController.js";
import protect, { authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only authenticated Admins can manage Staff
router.use(protect);
router.use(authorize("admin"));

router.get("/staff", getStaffUsers);
router.post("/staff", createStaffUser);
router.put("/staff/:id", updateStaffUser);
router.post("/staff/:id/reset-password", resetStaffPassword);
router.delete("/staff/:id", deleteStaffUser);

export default router;
