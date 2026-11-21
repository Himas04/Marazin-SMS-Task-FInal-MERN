import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/course.js";

export const getAttendance = async (req, res) => {
    const { course, student, date, status, moduleTitle } = req.query;
    const query = {};

    if (course) {
        query.course = course;
    }
    if (student) {
        query.student = student;
    }
    if (status) {
        query.status = status;
    }
    if (moduleTitle) {
        query.moduleTitle = moduleTitle;
    }
    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query.date = {
            $gte: start,
            $lt: end,
        };
    }

    const attendance = await Attendance.find(query)
        .populate("student", "studentId firstName lastName")
        .populate("course", "courseCode courseName")
        .sort({ date: -1 });

    res.json({ attendance });
};

export const getMyAttendance = async (req, res) => {
    const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
    });

    if (!student) {
        return res.json({ attendance: [] });
    }

    const attendance = await Attendance.find({ student: student._id })
        .populate("course", "courseCode courseName")
        .sort({ date: -1 });

    res.json({ attendance });
};

export const getAttendanceRecord = async (req, res) => {
    const record = await Attendance.findById(req.params.id)
        .populate("student")
        .populate("course");

    if (!record) {
        return res.status(404).json({
            message: "Attendance record not found",
        });
    }

    res.json({ attendance: record });
};

export const createAttendance = async (req, res) => {
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

    const course = req.body.course || req.body.courseId;
    const { date, status, remarks, moduleTitle, sessionPin } = req.body;
    const attendanceDate = date ? new Date(date) : new Date();

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
        student: studentId,
        course,
        status: { $ne: "Dropped" },
    });

    if (req.user.role === "student" && !enrollment) {
        return res.status(403).json({
            message: "You must be enrolled in this course to mark attendance or attend modules.",
        });
    }

    let courseDoc = null;
    if (course) {
        courseDoc = await Course.findById(course);
    }

    if (moduleTitle) {
        // Step 3: Session PIN validation if required by instructor
        if (courseDoc && courseDoc.modules) {
            const targetMod = courseDoc.modules.find((m) => m.title === moduleTitle);
            if (targetMod && targetMod.sessionPin) {
                const enteredPin = (sessionPin || "").toString().trim();
                const expectedPin = targetMod.sessionPin.toString().trim();
                if (enteredPin !== expectedPin) {
                    return res.status(400).json({
                        message: "Invalid session attendance PIN. Please check with your instructor.",
                    });
                }
            }
        }

        const existing = await Attendance.findOne({
            student: studentId,
            course,
            moduleTitle,
        });
        if (existing) {
            return res.status(400).json({
                message: `Attendance already recorded for module "${moduleTitle}"`,
                attendance: existing,
            });
        }
    } else {
        const start = new Date(attendanceDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const existing = await Attendance.findOne({
            student: studentId,
            course,
            moduleTitle: { $exists: false },
            date: {
                $gte: start,
                $lt: end,
            },
        });

        if (existing) {
            return res.status(400).json({
                message: "Attendance already marked for this student on this date",
            });
        }
    }

    const record = await Attendance.create({
        student: studentId,
        course,
        moduleTitle: moduleTitle || undefined,
        date: attendanceDate,
        status: status || "Present",
        remarks: remarks || (moduleTitle ? `Attended Module: ${moduleTitle}` : undefined),
    });

    // Step 1: Auto-complete enrollment when all course modules are attended
    let isCourseCompleted = false;
    if (enrollment && courseDoc && courseDoc.modules && courseDoc.modules.length > 0) {
        const allAttended = await Attendance.find({
            student: studentId,
            course,
            moduleTitle: { $exists: true },
        }).select("moduleTitle");

        const attendedTitles = new Set(allAttended.map((a) => a.moduleTitle));
        if (moduleTitle) attendedTitles.add(moduleTitle);

        if (attendedTitles.size >= courseDoc.modules.length) {
            enrollment.status = "Completed";
            await enrollment.save();
            isCourseCompleted = true;
        }
    }

    const populated = await Attendance.findById(record._id)
        .populate("student")
        .populate("course");

    res.status(201).json({
        message: isCourseCompleted 
            ? `Congratulations! All modules attended — Course marked as Completed!`
            : (moduleTitle ? `Attendance recorded for module "${moduleTitle}"` : "Attendance marked successfully"),
        attendance: populated,
        courseCompleted: isCourseCompleted,
    });
};

export const updateAttendance = async (req, res) => {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })
        .populate("student")
        .populate("course");

    if (!record) {
        return res.status(404).json({
            message: "Attendance record not found",
        });
    }

    res.json({
        message: "Attendance updated successfully",
        attendance: record,
    });
};

export const deleteAttendance = async (req, res) => {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) {
        return res.status(404).json({
            message: "Attendance record not found",
        });
    }

    res.json({
        message: "Attendance record deleted successfully",
    });
};