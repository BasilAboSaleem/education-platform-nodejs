const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');


admin_profile_get = async (req, res) => {
  try{
    const user = await User.findById(req.user.id).select("name email profilePicture createdAt")
    res.render("pages/admin/profile/my-profile", { user, moment });

  }
  catch(err){
    console.log(err);
        res.status(500).send('Error sending notification');

  }
}
admin_profile_edit_get = async (req, res) => {
  try{
    const user = await User.findById(req.user.id).select("name email profilePicture password")
    res.render("pages/admin/profile/edit-profile", { user, moment });

  }
  catch(err){
    console.log(err);
   res.status(500).send('Error sending notification');

  }
}

admin_profile_edit_put = async (req, res) => {
   try {
      // 1. جلب بيانات المستخدم (User) من قاعدة البيانات
      const user = await User.findById(req.user._id).select("name email profilePicture password");
  
      // التحقق من وجود المستخدم
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/login'); // إعادة التوجيه لصفحة تسجيل الدخول
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

      
      req.flash("success", "Profile updated successfully");
      res.redirect("/admin/profile");

    } catch (err) {
      console.error("Error updating student profile:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  module.exports = {
    admin_profile_get,
    admin_profile_edit_get,
    admin_profile_edit_put
  };