const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");
const Course = require("../models/course");
const Lesson = require("../models/lesson");
const Category = require("../models/Category");
const Enrollment = require("../models/enrollment");
const Payment = require("../models/payment");
const Notefication = require("../models/notification");

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
      status: "pending", // حالة التسجيل مؤقتة حتى يتم الدفع
    }); // جلب الكورس المرتبط بالتسجيل
    if(course.price === 0){
      enrollment.status = "active"; 
      await enrollment.save();
      //ارسال اشعار للمدرس
      const teacher = await Teachers.findById(course.teacher._id).populate({
        path: "user",
        select: "name",
      });
      const notification = await Notefication.create({
        recipient: teacher.user._id,
        sender: req.user._id,
        targetRole: "teacher",
        message: `New enrollment in your course: ${course.title}`,
        course: course._id,
      });
      req.flash("success", "You have successfully enrolled in the course.");
      return res.redirect("/student/my-courses");
    }

    if(course.price > 0){
      const payment = await Payment.create({
        enrollment: enrollment._id,
        paymentStatus: "unpaid",
        amount: course.price,
      }); 
      req.flash(
        "success",
        "You have successfully enrolled in the course. Please proceed to payment."
      );
      res.redirect("/student/course/" + courseId + "/payment");
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
      req.flash("error", "You are not enrolled in this course.");
      return res.redirect("/student/my-courses");
    }

    if (course.price > 0 && enrollment.status !== "active") {
      req.flash("error", "Payment required to access this course lesson.");
      return res.redirect("/student/my-courses/courseDetails/" + courseId);
    }
 
    if (enrollment.status !== "active") {
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
    if (enrollment.status === "active") {
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
    if (enrollment.status === "active") {
      req.flash("success", "You have already paid for this course.");
      return res.redirect("/student/my-courses/courseDetails/" + courseId);
    } 
    const payment = await Payment.findOne({
      enrollment: enrollment._id,
    }); // جلب الدفع الخاص بالتسجيل
    if (payment.paymentStatus === "paid") {
      req.flash("error", "Payment has already been made for this enrollment.");
      return res.redirect("/student/my-courses/courseDetails/" + courseId);
    }
    payment.paymentStatus = "paid"; // تحديث حالة الدفع إلى مدفوعة
    enrollment.status = "active"; // تحديث حالة التسجيل إلى نشطة
    payment.paymentMethod = req.body.paymentMethod; // حفظ طريقة الدفع
    payment.transactionId = req.body.transactionId || "TXN-" + Date.now(); // يمكنك توليد ID وهمي هنا
    await payment.save();
    await enrollment.save(); // حفظ التغييرات في قاعدة البيانات
    // إرسال إشعار للمدرس
    const teacher = await Teachers.findById(enrollment.course.teacher._id).populate({
      path: "user",
      select: "name",
    });
    const notification = await Notefication.create({
      recipient: teacher.user._id,
      sender: req.user._id,
      targetRole: "teacher",
      message: `New enrollment in your paid course: ${enrollment.course.title}`,
      course: enrollment.course._id,
    });
    //ارشال اشعار للأدمن
    const admin = await User.findOne({ role: "Admin" });
    const adminNotification = await Notefication.create({
      recipient: admin._id,
      sender: req.user._id,
      targetRole: "admin",
      message: `New enrollment in a paid course by ${student.user.name}: ${enrollment.course.title}`,
      course: enrollment.course._id,
    });
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
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) } }); // جلب جميع المدفوعات الخاصة بالتسجيلات
    const data = enrollments.map(enrollment => {
      const payment = payments.find(p => p.enrollment.toString() === enrollment._id.toString());
      return { enrollment, payment };
    });
      

    res.render("pages/student/myPayments", { data });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_notifications_get = async (req, res) => {
  try {

    // تحديث حالة الإشعارات الغير مقروءة إلى مقروءة
    await Notefication.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
// جلب جميع الإشعارات الخاصة بالمستخدم
    const notifications = await Notefication.find({ recipient: req.user._id }).populate({
      path: "sender",
      select: "name",
      model: "User",
    }).sort({ createdAt: -1 }); // ترتيب الإشعارات حسب تاريخ الإنشاء

    res.render("pages/student/notifications/all-notifications", { notifications, moment });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
student_profile_get = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email profilePicture createdAt"); 
    const student = await Student.findOne({ user: req.user._id }).select("phone address");
    res.render("pages/student/profile/my-profile", { user , student , moment });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

student_profile_edit_get = async (req, res) => {
  try{
    const user = await User.findById(req.user._id).select("name email profilePicture");
    const student = await Student.findOne({ user: req.user._id }).select("phone address");
    res.render("pages/student/profile/edit-profile", { user , student });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


student_profile_edit_put = async (req, res) => {
  try {
    // 1. جلب بيانات المستخدم (User) والطالب (Student) من قاعدة البيانات
    const user = await User.findById(req.user._id).select("name email profilePicture password");
    const student = await Student.findOne({ user: req.user._id });

    // التحقق من وجود المستخدم
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login'); // إعادة التوجيه لصفحة تسجيل الدخول
    }

    // التحقق من وجود الطالب
    if (!student) {
      req.flash('error', 'Student profile not found');
      return res.redirect('/student/profile/edit'); // إعادة التوجيه لصفحة تعديل الملف
    }

    // 2. تجهيز كائن البيانات الجديدة، مع الحفاظ على القيم القديمة إن لم تُرسل جديدة
    const updatedUserData = {
      name: req.body.name ?? user.name,
      email: req.body.email ?? user.email,
      profilePicture: user.profilePicture, // نبدأ بالصورة الحالية، ونحدثها لاحقًا إذا تم رفع صورة جديدة
    };

    // 3. التعامل مع رفع صورة جديدة (إن وُجدت)
    if (req.file) {
      // حذف الصورة القديمة من Cloudinary إذا كانت موجودة
      if (user.profilePicture) {
        try {
          await cloudinary.uploader.destroy(user.profilePicture);
        } catch (err) {
          console.error("Error deleting old image from Cloudinary:", err);
          // الخطأ هنا غير حرج، نكمل التحديث
        }
      }

      // رفع الصورة الجديدة إلى Cloudinary
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "LMS/courses", // تعديل المسار حسب تنظيم مشروعك
        use_filename: true,
        unique_filename: false,
      });

      // تحديث رابط الصورة والمعرف الخاص بها
      updatedUserData.profilePicture = uploadResult.secure_url;
      updatedUserData.profilePicturePublicId = uploadResult.public_id;
    }

    // 4. التحقق من كلمة المرور الجديدة إذا تم إرسالها
    if (req.body.password && req.body.password.trim() !== "") {
      const password = req.body.password.trim();

      // تحقق من قوة كلمة المرور
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
      if (!passwordRegex.test(password)) {
        req.flash(
          "error",
          "Password must be at least 8 characters with 1 upper case letter, 1 number, and 1 special character."
        );
        return res.redirect("/student/profile/edit");
      }

      // تشفير كلمة المرور الجديدة
      updatedUserData.password = await bcrypt.hash(password, 10);
    } else {
      // إذا لم يتم إرسال كلمة مرور جديدة، نحتفظ بالقديمة
      updatedUserData.password = user.password;
    }

    // 5. تحديث بيانات المستخدم (User)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedUserData,
      { new: true } // استرجاع البيانات المحدثة
    ).select("name email profilePicture");

    // 6. تحديث بيانات الطالب (Student) أو الحفاظ على القيم القديمة
    const updatedStudent = await Student.findOneAndUpdate(
      { user: req.user._id },
      {
        phone: req.body.phone ?? student.phone,
        address: req.body.address ?? student.address,
      },
      { new: true } // استرجاع البيانات المحدثة
    ).select("phone address");

    // 7. رسالة نجاح وإعادة التوجيه إلى صفحة البروفايل
    req.flash("success", "Profile updated successfully");
    res.redirect("/student/profile");

  } catch (err) {
    // 8. التعامل مع الأخطاء العامة
    console.error("Error updating student profile:", err);
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
  student_notifications_get,
  student_profile_get,
  student_profile_edit_get,
  student_profile_edit_put,
};
