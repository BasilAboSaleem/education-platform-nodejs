const {
  User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload, cloudinary, fs, render 
} = require('./utils');

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

module.exports = {
  student_course_payment_get,
  student_course_payment_post,
  student_payments_get,
};