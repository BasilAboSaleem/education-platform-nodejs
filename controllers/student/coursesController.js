const {
  User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload, cloudinary, fs, render 
} = require('./utils');

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
    res.render("pages/student/coursess/all-courses", { courses: courses, categories });
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
    res.render("pages/student/coursess/all-courses", { courses: courses, categories });
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
    res.render("pages/student/coursess/all-courses", { courses: courses, categories });
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
    res.render("pages/student/coursess/course-detail", { course });
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
    res.render("pages/student/coursess/my-courses", { enrollments });
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
    
    res.render("pages/student/coursess/my-courseDetails", {
      enrollment,
      startLessonId,
      progressPercent,
    });
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
};