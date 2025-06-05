const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');


admin_send_notification_get = async (req,res) => {
  try{
    const students = await User.find({ role: 'Student' }).select('name email');
    const teachers = await User.find({ role: 'Teacher' }).select('name email');
    const courses = await Course.find();
    res.render("pages/admin/notifications/send-notification", {students, teachers, courses, moment});

  }
  catch(err){
    console.log(err);
    res.status(500).send('Error sending notification');
  }

}

admin_send_notification_post = async (req, res) => {
  try {
    const { targetRole, recipient, course, message, title, link } = req.body;

    if (targetRole === 'all_students') {
      const students = await User.find({ role: 'Student' });
      for (let student of students) {
        await Notification.create({
          targetRole: 'student',
          recipient: student._id,
          message,
          title,
          link,
          sender: req.user._id
        });
      }
       req.flash('success', 'Notifications sent successfully');

    } else if (targetRole === 'all_teachers') {
      const teachers = await User.find({ role: 'Teacher' });
      for (let teacher of teachers) {
        await Notification.create({
          targetRole: 'teacher',
          recipient: teacher._id,
          message,
          title,
          link,
          sender: req.user._id
        });
      }
       req.flash('success', 'Notifications sent successfully');

    } else if (targetRole === 'course_students' && course) {
      const enrollments = await Enrollment.find({ course }).populate("student");
      if (!enrollments.length) {
        return res.status(404).send("No students enrolled in this course.");
      }
      for (let enrollment of enrollments) {
        await Notification.create({
          targetRole: 'student',
          recipient: enrollment.student._id,
          message,
          title,
          link,
          sender: req.user._id
        });
      }
       req.flash('success', 'Notifications sent successfully');

    } else if (
      (targetRole === 'specific_student' || targetRole === 'specific_teacher') &&
      recipient
    ) {
      const user = await User.findById(recipient);
      if (!user) {
        return res.status(404).send('User not found');
      }

    const expectedRole = targetRole.split('_')[1].toLowerCase(); // 'student' or 'teacher'
if (user.role.toLowerCase() !== expectedRole) {
  return res.status(400).send('Recipient role mismatch');
}

      await Notification.create({
        targetRole:  expectedRole, // 'student' or 'teacher'
        recipient: user._id,
        message,
        title,
        link,
        sender: req.user._id
      });

       req.flash('success', 'Notification sent successfully');
    } else {
          req.flash('error', 'Invalid notification target or missing data');

    }

    res.redirect("/admin/send-notification");


  } catch (err) {
    console.log(err);
    res.status(500).send('Error sending notification');
  }
}


admin_notifications_get = async (req, res) => {
  try {
    const received = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name role');

    const sent = await Notification.find({ sender: req.user._id })
      .populate('recipient', 'name role')
      .populate('course', 'title');

    res.render("pages/admin/notifications/all-notifications", {
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
  admin_send_notification_get,
  admin_send_notification_post,
  admin_notifications_get
};