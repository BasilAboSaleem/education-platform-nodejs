const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');

admin_delete_userUnverified_delete = async (req, res) => {
  try {
    const userId = req.params.id;

    // تأكد أن المستخدم غير موثّق قبل الحذف
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/dashboard");
    }

    if (user.isVerified) {
      req.flash("error", "You cannot delete a verified user");
      return res.redirect("/dashboard");
    }

    // حذف المستخدم والكيانات المرتبطة
    await User.findByIdAndDelete(userId);
    await Teachers.findOneAndDelete({ user: userId });
    await Student.findOneAndDelete({ user: userId });

    req.flash("success", "Unverified user deleted successfully");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error deleting unverified user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  admin_delete_userUnverified_delete,
};