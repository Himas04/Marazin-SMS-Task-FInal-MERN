import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';

export const getEnrollments = async (req, res) => {
    const { course, student, status } = req.query;
    const query = {};

    if (course) query.course = course;
    if (student) query.student = student;
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
        .populate("student", "studentId firstName lastName email")
        .populate({
            path: "course",
            populate: { path: "instructor", select: "name email department" }
        })
        .sort({ enrollmentDate: -1 });

    const attendanceRecords = await Attendance.find({
        moduleTitle: { $exists: true }
    }).select("student course moduleTitle");

    const enrichedEnrollments = enrollments.map((enr) => {
        const obj = enr.toObject();
        const crs = obj.course;
        const totalMods = crs?.modules?.length || 0;
        const sId = obj.student?._id?.toString() || obj.student?.toString();
        const cId = crs?._id?.toString() || crs?.toString();
        const attendedInCrs = attendanceRecords.filter(a => 
            a.student?.toString() === sId && a.course?.toString() === cId
        );
        const uniqueAttended = new Set(attendedInCrs.map(a => a.moduleTitle)).size;
        obj.totalModules = totalMods;
        obj.completedModules = uniqueAttended;
        obj.progress = totalMods > 0 ? Math.min(100, Math.round((uniqueAttended / totalMods) * 100)) : 0;
        return obj;
    });

    res.json({ enrollments: enrichedEnrollments });
};

export const getMyEnrollments = async (req, res) => {
    const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
    });

    if (!student) {
        return res.json({ enrollments: [] });
    }

    const enrollments = await Enrollment.find({ student: student._id })
        .populate({
            path: "course",
            populate: { path: "instructor", select: "name email department" }
        })
        .sort({ enrollmentDate: -1 });

    const attendanceRecords = await Attendance.find({
        student: student._id,
        moduleTitle: { $exists: true }
    }).select("course moduleTitle");

    const enrichedEnrollments = enrollments.map((enr) => {
        const obj = enr.toObject();
        const crs = obj.course;
        const totalMods = crs?.modules?.length || 0;
        const cId = crs?._id?.toString() || crs?.toString();
        const attendedInCrs = attendanceRecords.filter(a => a.course?.toString() === cId);
        const uniqueAttended = new Set(attendedInCrs.map(a => a.moduleTitle)).size;
        obj.totalModules = totalMods;
        obj.completedModules = uniqueAttended;
        obj.progress = totalMods > 0 ? Math.min(100, Math.round((uniqueAttended / totalMods) * 100)) : 0;
        return obj;
    });

    res.json({ enrollments: enrichedEnrollments });
};

export const getEnrollment = async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id)
        .populate("student")
        .populate("course");

    if (!enrollment) {
        return res.status(404).json({
            message: "Enrollment not found"
        });
    }

    res.json({ enrollment });
};

export const createEnrollment = async (req, res) => {
    let studentId = req.body.student;
    if (req.user.role === "student") {
        const student = await Student.findOne({
            $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
        });
        if (!student) {
            return res.status(404).json({ message: "Student record not found" });
        }
        studentId = student._id;
    }

    const courseId = req.body.course || req.body.courseId;
    if (!studentId || !courseId) {
        return res.status(400).json({ message: "Student and Course are required" });
    }

    const existing = await Enrollment.findOne({
        student: studentId,
        course: courseId,
    });
    if (existing) {
        return res.status(400).json({
            message: "Student is already enrolled in this course",
            enrollment: existing,
        });
    }

    const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        batch: req.body.batch || "2026-Cohort",
        status: req.body.status || "Active",
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
        .populate("student")
        .populate("course");

    res.status(201).json({
        message: "Enrolled in course successfully",
        enrollment: populatedEnrollment,
    });
};

export const updateEnrollment = async (req, res) => {
    const enrollment = await Enrollment.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        },
    )
        .populate("student")
        .populate("course");

    if (!enrollment) {
        return res.status(404).json({
            message: "Enrollment not found",
        });
    }

    res.json({
        message: "Enrollment updated successfully",
        enrollment,
    });
};

export const deleteEnrollment = async (req, res) => {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
        return res.status(404).json({
            message: "Enrollment not found",
        });
    }

    res.json({
        message: "Enrollment deleted successfully",
    });
};