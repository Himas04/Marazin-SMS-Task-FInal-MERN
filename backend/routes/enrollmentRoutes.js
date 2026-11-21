import express from "express";
import {
  getEnrollments,
  getMyEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} from "../controllers/enrollmentController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my", getMyEnrollments);

router.get("/", getEnrollments);
router.post("/", createEnrollment);
router.post("/enroll", createEnrollment);

router.get("/:id", getEnrollment);
router.put("/:id", updateEnrollment);
router.delete("/:id", deleteEnrollment);

export default router;
