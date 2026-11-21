import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import protect, { authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getAnnouncements);
router.post("/", authorize("admin", "staff"), createAnnouncement);
router.delete("/:id", authorize("admin", "staff"), deleteAnnouncement);

export default router;
