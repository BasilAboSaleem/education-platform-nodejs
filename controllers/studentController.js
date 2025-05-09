const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");
const Course = require("../models/course");
const Lesson = require("../models/lesson");
const Category = require("../models/Category");
const Enrollment = require("../models/enrollment");

const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const moment = require("moment");
const multer = require("multer");
const upload = multer({ storage: multer.diskStorage({}) });
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const fs = require("fs");
const teacher = require("../models/teacher");
const { render } = require("ejs");
// Configuration cloudinary اعدادات الكلاودنري
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
//////////////////////////////////////////////////////////

student_allCourses_get = async (req, res) => {
  try {
    const categories = await Category.find(); // جلب جميع الفئات
    const courses = await Course.find({ status: "Published" })
      .populate({
        path: "category",
        select: "name",
      })
      .populate({
        path: "teacher",
        populate: {
          path: "user",
          select: "name",
          model: "User",
        },
      })
      .populate("lessons");
    res.render("pages/student/all-courses", { courses: courses, categories });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_allCourses_free_get = async (req, res) => {
  try {
    const categories = await Category.find(); // جلب جميع الفئات
    const courses = await Course.find({ status: "Published", price: 0 })
      .populate({
        path: "category",
        select: "name",
      })
      .populate({
        path: "teacher",
        populate: {
          path: "user",
          select: "name",
          model: "User",
        },
      })
      .populate("lessons");
    res.render("pages/student/all-courses", { courses: courses, categories });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_allCourses_category_get = async (req, res) => {
  try {
    const categoryId = req.params.id; // الحصول على الـ id من الرابط
    const categories = await Category.find(); // جلب جميع الفئات
    const courses = await Course.find({
      status: "Published",
      category: categoryId,
    }) // جلب الكورسات المتعلقة بالفئة
      .populate({
        path: "category",
        select: "name",
      })
      .populate({
        path: "teacher",
        populate: {
          path: "user",
          select: "name",
          model: "User",
        },
      })
      .populate("lessons");

    // تمرير الكورسات والفئات إلى الواجهة
    res.render("pages/student/all-courses", { courses: courses, categories });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_allCourses_courseDetails_get = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id) // جلب الكورس
      .populate({
        path: "category",
        select: "name",
      })
      .populate({
        path: "teacher",
        populate: {
          path: "user",
          select: "name",
          model: "User",
        },
      })
      .populate("lessons");
    res.render("pages/student/course-detail", { course });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_enroll_course_post = async (req, res) => {
  try {
    const courseId = req.params.id; // الحصول على الـ id من الرابط
    const userId = req.user._id; // الحصول على الـ id الخاص بالطالب من التوكن
    // الان بدنا نجيب الطالب المرتبط باليوزر student_.id
    const student = await Student.findOne({ user: userId }); // جلب الطالب المرتبط باليوزر
    const course = await Course.findById(courseId); // جلب الكورس

    // التحقق مما إذا كان الطالب مسجلاً في الكورس بالفعل
    const existingEnrollment = await Enrollment.findOne({
      student: student._id,
      course: courseId,
    });
    if (existingEnrollment) {
      req.flash("error", "You are already enrolled in this course.");
      return res.redirect("/student/all-courses/courseDetails/" + courseId); // إعادة توجيه الطالب إلى صفحة تفاصيل الكورس
    }

    // إنشاء تسجيل جديد
    const enrollment = await Enrollment.create({
      student: student._id,
      course: courseId,
    });
    if (course.price > 0) {
      enrollment.paymentStatus = "unpaid"; // إذا كان الكورس مدفوع، اجعل حالة الدفع غير مدفوعة
      enrollment.status = "pending";
      await enrollment.save(); // حفظ التسجيل في قاعدة البيانات
      req.flash(
        "success",
        "You have successfully enrolled in the course. Please proceed to payment."
      );
      //تحويل الطالب لصفحة الدفع
      return res.redirect("/student/course/" + courseId + "/payment");
    } else {
      enrollment.paymentStatus = "free"; // إذا كان الكورس مجاني، اجعل حالة الدفع مجانية
      enrollment.status = "active"; // اجعل حالة التسجيل نشطة
      await enrollment.save(); // حفظ التسجيل في قاعدة البيانات
      req.flash("success", "You have successfully enrolled in the course.");

      //تحويل الطالب لصفحة كورساتي
      return res.redirect("/student/my-courses");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_myCourses_get = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }); // الحصول على الـ id الخاص بالطالب من التوكن
    const enrollments = await Enrollment.find({ student: student._id }) // جلب جميع التسجيلات الخاصة بالطالب
      .populate({
        path: "course",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .populate({
        path: "course",
        populate: {
          path: "teacher",
          populate: {
            path: "user",
            select: "name",
            model: "User",
          },
        },
      });
    res.render("pages/student/my-courses", { enrollments });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_myCourses_courseDetails_get = async (req, res) => {
  try {
    const courseId = req.params.id; // الحصول على الـ id من الرابط
    const student = await Student.findOne({ user: req.user._id }); // الحصول على الـ id الخاص بالطالب من التوكن
    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: courseId,
    }) // جلب التسجيل الخاص بالطالب في الكورس
      .populate("course") // جلب الكورس الخاص بالتسجيل
    .populate({
        path: "course",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .populate({
        path: "course",
        populate: {
          path: "teacher",
          populate: {
            path: "user",
            select: "name",
            model: "User",
          },
        },
      })
      .populate({
        path: "course",
        populate: {
          path: "lessons",
          select: "title",
        },
      }); // جلب الدروس الخاصة بالكورس
    if (!enrollment) {
      req.flash("error", "You are not enrolled in this course.");
      return res.redirect("/student/my-courses");
    }
    // تحديد الدرس الذي يجب أن يظهر كـ "Start Now"
    let startLessonId;
    if (enrollment.lastWatchedLesson) {
      // إذا كان الطالب قد شاهد درسًا مسبقًا، ابدأ من الدرس التالي
      const currentLessonIndex = enrollment.course.lessons.findIndex(
        (lesson) =>
          lesson._id.toString() === enrollment.lastWatchedLesson.toString()
      );

      // ✅ إذا أنهى كل الدروس، لا تبدأ من جديد
      if (currentLessonIndex + 1 < enrollment.course.lessons.length) {
        startLessonId = enrollment.course.lessons[currentLessonIndex + 1]._id;
      } else {
        // ✅ كل الدروس منتهية، خليه يبدأ من آخر درس شافه
        startLessonId = enrollment.lastWatchedLesson;
      }
    } else {
      // إذا لم يكن قد شاهد أي درس بعد، ابدأ من أول درس
      startLessonId = (enrollment.course.lessons && enrollment.course.lessons.length > 0)
        ? enrollment.course.lessons[0]._id
        : null;
    }
    //الان تفعيل التقدم البروجريس
    // إجمالي عدد الدروس
    const totalLessons = enrollment.course.lessons.length;

    // إذا ما في lastWatchedLesson → التقدم صفر
    let progressPercent = 0;

    if (enrollment.watchedLessons && enrollment.watchedLessons.length > 0) {
      const watchedCount = enrollment.watchedLessons.length;
      progressPercent = Math.round((watchedCount / totalLessons) * 100);
    }
    
    res.render("pages/student/my-courseDetails", {
      enrollment,
      startLessonId,
      progressPercent,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

student_course_lesson_get = async (req, res) => {
  try {
    const courseId = req.params.id; // الحصول على الـ id من الرابط
    const lessonId = req.params.lessonId; // الحصول على الـ id من الرابط
    const student = await Student.findOne({ user: req.user._id }); // الحصول على الـ id الخاص بالطالب من التوكن
    const course = await Course.findById(courseId).populate("lessons"); // جلب الدروس الخاصة بالكورس
    if (!course) {
      req.flash("error", "Course not found.");
      return res.redirect(`/student/my-courses/courseDetails/${courseId}`);
    }

    // جلب الدرس الخاص بالكورس بهذه الطريقة أكثر أمانًا من فايند باي ايدي مباشرة
    const lesson = course.lessons.find(
      (lsn) => lsn._id.toString() === lessonId
    );

    if (!lesson) {
      req.flash("error", "Lesson not found.");
      return res.redirect(`/student/my-courses/courseDetails/${courseId}`);
    }

    // التحقق مما إذا كان الطالب مسجلاً في الكورس
    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: courseId,
    }); // جلب التسجيل الخاص بالطالب في الكورس

    if (!enrollment) {
      console.log(
        "Enrollment not found for student:",
        student._id,
        "in course:",
        courseId
      );
      req.flash("error", "You are not enrolled in this course.");
      return res.redirect("/student/my-courses");
    }

    if (course.price > 0 && enrollment.paymentStatus !== "paid") {
      req.flash("error", "Payment required to access this course lesson.");
      return res.redirect("/student/my-courses/courseDetails/" + courseId);
    }

    if (enrollment.status !== "active") {
      console.log(
        "Enrollment status is not active for student:",
        studentId,
        "in course:",
        courseId
      );
      req.flash("error", "Your enrollment is pending approval or incomplete.");
      return res.redirect("/student/my-courses/courseDetails/" + courseId);
    }

    // ✅ تحديث watchedLessons إن لم يكن موجود مسبقًا
    const lessonObjectId = lesson._id.toString();
    const alreadyWatched = enrollment.watchedLessons.some(
      (watchedId) => watchedId.toString() === lessonObjectId
    );
    if (!alreadyWatched) {
      enrollment.watchedLessons.push(lesson._id); // إضافة الدرس إلى watchedLessons إذا لم يكن موجودًا بالفعل
    }

    // بعد التحقق من أن الدرس تم مشاهدته
    enrollment.lastWatchedLesson = lesson._id; // تحديث آخر درس شاهده الطالب
    await enrollment.save(); // حفظ الدرس الذي شاهده الطالب في قاعدة البيانات

    // 2. تحديد index الدرس الحالي
    const lessonIndex = course.lessons.findIndex(
      (lsn) => lsn._id.toString() === lessonId
    );

    // 3. جلب الدروس السابقة والتالية (إن وجدت)
    const prevLesson = course.lessons[lessonIndex - 1] || null;
    const nextLesson = course.lessons[lessonIndex + 1] || null;

    // تم إرسال جميع البيانات إلى صفحة الدرس الخاصة بالطالب
    res.render("pages/student/lesson-view", {
      lesson,
      course,
      prevLesson,
      nextLesson,
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong.");
    res.redirect("/student/my-courses"); // التعامل مع الأخطاء وتحويل الطالب إلى صفحة الكورسات
  }
};

student_course_payment_get = async (req, res) => {
  try {
    const courseId = req.params.id;
    const student = await Student.findOne({ user: req.user._id }); // الحصول على الـ id الخاص بالطالب من التوكن
    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: courseId,
    }).populate("course");
    if (!enrollment) {
      req.flash("error", "You are not enrolled in this course.");
      return res.redirect("/student/my-courses");
    }
    if (enrollment.paymentStatus === "paid") {
      req.flash("success", "You have already paid for this course.");
      return res.redirect("/student/my-courses/courseDetails/" + courseId);
    }

    res.render("pages/student/payment", { enrollment });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_course_payment_post = async (req, res) => {
  try {
    const courseId = req.params.id;
    const student = await Student.findOne({ user: req.user._id }); // الحصول على الـ id الخاص بالطالب من التوكن
    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: courseId,
    }).populate("course");
    if (!enrollment) {
      req.flash("error", "You are not enrolled in this course.");
      return res.redirect("/student/my-courses");
    }
    if (enrollment.paymentStatus === "paid") {
      req.flash("success", "You have already paid for this course.");
      return res.redirect("/student/my-courses/courseDetails/" + courseId);
    }
    enrollment.paymentStatus = "paid"; // تحديث حالة الدفع إلى مدفوعة
    enrollment.status = "active"; // تحديث حالة التسجيل إلى نشطة
    enrollment.paymentMethod = req.body.paymentMethod; // حفظ طريقة الدفع
    await enrollment.save(); // حفظ التغييرات في قاعدة البيانات
    req.flash("success", "Payment successful. You can now access the course.");

    return res.redirect("/student/my-courses");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_payments_get = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }); // الحصول على الـ id الخاص بالطالب من التوكن
    const enrollments = await Enrollment.find({ student: student._id }) // جلب جميع التسجيلات الخاصة بالطالب
      .populate("course");
    res.render("pages/student/myPayments", { enrollments });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  student_allCourses_get,
  student_allCourses_free_get,
  student_allCourses_category_get,
  student_allCourses_courseDetails_get,
  student_enroll_course_post,
  student_myCourses_get,
  student_myCourses_courseDetails_get,
  student_course_lesson_get,
  student_course_payment_get,
  student_course_payment_post,
  student_payments_get,
};
