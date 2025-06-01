const {
  User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload, cloudinary, fs, render 
} = require('./utils');

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

module.exports = {
  student_notifications_get,
};