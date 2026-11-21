import express from "express";

import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
} from "../controllers/courseController.js";

import protect, { authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getCourses);
router.get("/:id", getCourse);

// Admin & Staff can manage courses & modules
router.post("/", authorize("admin", "staff"), createCourse);
router.put("/:id", authorize("admin", "staff"), updateCourse);
router.delete("/:id", authorize("admin", "staff"), deleteCourse);

router.post("/:id/modules", authorize("admin", "staff"), addModule);
router.put("/:id/modules/:moduleId", authorize("admin", "staff"), updateModule);
router.delete("/:id/modules/:moduleId", authorize("admin", "staff"), deleteModule);

export default router;
