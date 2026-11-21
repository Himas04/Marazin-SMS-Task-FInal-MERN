import express from "express";
import {
  getAttendance,
  getMyAttendance,
  getAttendanceRecord,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my", getMyAttendance);

router.get("/", getAttendance);
router.post("/", createAttendance);
router.post("/module", createAttendance);

router.get("/:id", getAttendanceRecord);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;
