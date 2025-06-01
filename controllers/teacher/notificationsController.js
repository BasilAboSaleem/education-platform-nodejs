const { User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, upload, cloudinary, fs, teacher,
  path, enrollment, Parser, send
} = require('./utils');


teacher_send_notification_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});

    const courses = await Course.find({ teacher: teacher._id })

    res.render("pages/teacher/notifications/send-notification", { courses });
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
  
}
teacher_send_notification_post = async (req, res) => {
  try{
    const { title, message , link } = req.body;
    const teacher = await Teachers.findOne({user: req.user._id});
    const course = await Course.findById(req.body.course);
    if (!course) {
      req.flash("error", "Course not found.");
      return res.redirect("/teacher/send-notification");
    }
    const students = await Enrollment.find({ course: course._id }).populate({
      path: "student",
      populate: {
        path: "user",
        select: "name email"
      }
    });
    // إرسال الإشعار إلى الطلاب
    students.forEach(async student => {
      await Notification.create({
        title: title,
        message: message,
        recipient: student._id,
        sender: teacher.user._id,
        targetRole: "student",
        course: course._id,
        link: link
      });
      
    });
    
    req.flash("success", "Notification sent successfully.");
    res.redirect("/teacher/send-notification");
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}

teacher_notifications_get = async (req, res) => {
 try {
   // تحديث حالة الإشعارات الغير مقروءة إلى مقروءة
      await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
      );
     const received = await Notification.find({ recipient: req.user._id })
          .populate('sender', 'name role');
    
        const sent = await Notification.find({ sender: req.user._id })
          .populate('recipient', 'name role')
          .populate('course', 'title');
    
        res.render("pages/teacher/notifications/all-notifications", {
          tab: req.query.tab || 'received',
          receivedNotifications: received,
          sentNotifications: sent,
          user: req.user,
          moment
        });
      } catch (err) {
        console.error(err);
        res.status(500).send('Error loading notifications');
      }
    };

    module.exports = {
      teacher_send_notification_get,
      teacher_send_notification_post,
      teacher_notifications_get
    };