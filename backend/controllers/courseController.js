import Course from "../models/course.js";

export const getCourses = async (req, res) => {
  const { search = "", status } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { courseCode: { $regex: search, $options: "i" } },
      { courseName: { $regex: search, $options: "i" } }
    ];
  }
  if (status) {
    query.status = status;
  }
  const courses = await Course.find(query)
    .populate("instructor", "name email department")
    .sort({ createdAt: -1 });
  res.json({ courses });
};

export const getCourse = async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("instructor", "name email department");
  if (!course) {
    return res.status(404).json({
      message: "Course not found",
    });
  }
  res.json({ course });
};

export const createCourse = async (req, res) => {
  const courseData = { ...req.body };
  if (req.user?.role === "staff" && !courseData.instructor) {
    courseData.instructor = req.user._id;
  }
  const course = await Course.create(courseData);
  const populated = await Course.findById(course._id)
    .populate("instructor", "name email department");
  res.status(201).json({
    message: "Course created successfully",
    course: populated,
  });
};

export const updateCourse = async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("instructor", "name email department");
  if (!course) {
    return res.status(404).json({
      message: "Course not found",
    });
  }
  res.json({
    message: "Course updated successfully",
    course,
  });
};

export const deleteCourse = async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    return res.status(404).json({
      message: "Course not found",
    });
  }
  res.json({
    message: "Course deleted successfully",
  });
};

export const addModule = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }
  const newModule = req.body;
  if (!newModule.order) {
    newModule.order = (course.modules?.length || 0) + 1;
  }
  course.modules.push(newModule);
  await course.save();
  res.status(201).json({
    message: "Module added to course successfully",
    course,
    module: course.modules[course.modules.length - 1],
  });
};

export const updateModule = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }
  const mod = course.modules.id(req.params.moduleId);
  if (!mod) {
    return res.status(404).json({ message: "Module not found" });
  }
  Object.assign(mod, req.body);
  await course.save();
  res.json({
    message: "Module updated successfully",
    course,
    module: mod,
  });
};

export const deleteModule = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }
  course.modules.pull(req.params.moduleId);
  await course.save();
  res.json({
    message: "Module removed from course",
    course,
  });
};