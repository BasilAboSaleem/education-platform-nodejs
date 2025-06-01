const {
  User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload, cloudinary, fs, render 
} = require('./utils');


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
  student_profile_get,
  student_profile_edit_get,
  student_profile_edit_put,
};