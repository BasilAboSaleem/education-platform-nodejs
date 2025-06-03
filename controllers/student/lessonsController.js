const {
  User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload, cloudinary, fs, render 
} = require('./utils');

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

    //  تحديث watchedLessons إن لم يكن موجود مسبقًا
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
    res.render("pages/student/lessons/lesson-view", {
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
module.exports = {
  student_course_lesson_get,
};