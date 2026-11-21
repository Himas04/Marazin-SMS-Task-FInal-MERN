import Student from "../models/Student.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import Attendance from "../models/Attendance.js";

export const getStudents = async (req, res) => {
  const { search = "", status, page = 1, limit = 10 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    query.status = status;
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const [students, total] = await Promise.all([
    Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
    Student.countDocuments(query),
  ]);

  const studentIds = students.map((s) => s._id);
  const [attendanceRecords, enrollmentRecords] = await Promise.all([
    Attendance.find({ student: { $in: studentIds } }).select("student status"),
    Enrollment.find({ student: { $in: studentIds } }).select("student status"),
  ]);

  const studentsWithStats = students.map((s) => {
    const sAtt = attendanceRecords.filter((a) => a.student.toString() === s._id.toString());
    const totalAtt = sAtt.length;
    const presentAtt = sAtt.filter((a) => a.status === "Present").length;
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    const sEnr = enrollmentRecords.filter((e) => e.student.toString() === s._id.toString());

    const doc = s.toObject();
    doc.attendanceRate = attendanceRate;
    doc.totalClasses = totalAtt;
    doc.enrollmentCount = sEnr.length;
    return doc;
  });

  res.json({
    students: studentsWithStats,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  });
};

export const getStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  const [enrollments, attendance] = await Promise.all([
    Enrollment.find({ student: student._id }).populate("course").sort({ enrollmentDate: -1 }),
    Attendance.find({ student: student._id }).populate("course", "courseCode courseName").sort({ date: -1 }),
  ]);

  res.json({ 
    student,
    enrollments,
    attendance,
  });
};

export const getMyStudentProfile = async (req, res) => {
  const student = await Student.findOne({
    $or: [{ email: req.user.email }, { studentId: req.user.studentId }],
  });

  if (!student) {
    return res.status(404).json({
      message: "Student profile record not found",
    });
  }

  const [enrollments, attendance] = await Promise.all([
    Enrollment.find({ student: student._id }).populate("course").sort({ enrollmentDate: -1 }),
    Attendance.find({ student: student._id }).populate("course", "courseCode courseName").sort({ date: -1 }),
  ]);

  res.json({ 
    student,
    enrollments,
    attendance,
  });
};

export const createStudent = async (req, res) => {
  const student = await Student.create(req.body);

  // Automatically create a user login for this student if one doesn't exist
  try {
    const existingUser = await User.findOne({ email: student.email });
    if (!existingUser) {
      const password = req.body.password || student.studentId || "student123";
      await User.create({
        name: `${student.firstName} ${student.lastName}`.trim(),
        email: student.email,
        password,
        role: "student",
        studentId: student.studentId,
        studentProfile: student._id,
      });
    }
  } catch (err) {
    console.error("Could not auto-create User for student:", err.message);
  }

  res.status(201).json({
    message: "Student created successfully",
    student,
  });
};

export const updateStudent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!student) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  // Sync with user record
  try {
    await User.findOneAndUpdate(
      { email: student.email },
      {
        name: `${student.firstName} ${student.lastName}`.trim(),
        studentId: student.studentId,
      }
    );
  } catch (err) {
    console.error("Could not sync user:", err.message);
  }

  res.json({
    message: "Student updated successfully",
    student,
  });
};

export const deleteStudent = async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  // Remove corresponding user account and associations
  try {
    await Promise.all([
      User.findOneAndDelete({ email: student.email }),
      Enrollment.deleteMany({ student: student._id }),
      Attendance.deleteMany({ student: student._id }),
    ]);
  } catch (err) {
    console.error("Could not delete associated records for student:", err.message);
  }

  res.json({
    message: "Student deleted successfully",
  });
};