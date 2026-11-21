import Announcement from "../models/Announcement.js";

export const getAnnouncements = async (req, res) => {
  const role = req.user?.role || "student";
  const query = {};

  if (role === "student") {
    query.targetRole = { $in: ["all", "student"] };
  } else if (role === "staff") {
    query.targetRole = { $in: ["all", "staff"] };
  }
  // Admins see all announcements

  const announcements = await Announcement.find(query)
    .populate("author", "name email role department")
    .sort({ createdAt: -1 });

  res.json({ announcements });
};

export const createAnnouncement = async (req, res) => {
  const { title, content, targetRole, priority } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  const announcement = await Announcement.create({
    title,
    content,
    targetRole: targetRole || "all",
    priority: priority || "normal",
    author: req.user._id,
    authorName: req.user.name || "Faculty / Administration",
  });

  const populated = await Announcement.findById(announcement._id)
    .populate("author", "name email role department");

  res.status(201).json({
    message: "Announcement broadcasted successfully",
    announcement: populated,
  });
};

export const deleteAnnouncement = async (req, res) => {
  const query = { _id: req.params.id };

  // Staff can only delete their own announcements, admin can delete any
  if (req.user.role === "staff") {
    query.author = req.user._id;
  }

  const deleted = await Announcement.findOneAndDelete(query);
  if (!deleted) {
    return res.status(404).json({ message: "Announcement not found or unauthorized to delete" });
  }

  res.json({ message: "Announcement deleted successfully" });
};
