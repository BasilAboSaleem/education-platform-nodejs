const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');


  admin_pending_lessons_get = async (req,res) => {
    try{
      const lessons = await Lesson.find({ status: "Under Review" }).populate({
        path: 'course',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          populate: {
            path: 'user',
            select: 'name'
          }
        }
      }).sort({ createdAt: -1 }).lean(); 
      res.render("pages/admin/courses/pending-lessons", { lessons, moment });
    }      
    catch(err){
        console.log(err)
    }
  }
  admin_pending_lessons_view_get = async (req,res) => {
    try{
      const lesson = await Lesson.findById(req.params.id).populate({

        path: 'course',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          populate: {
            path: 'user',
            select: 'name'
          }
        }
      });
      res.render("pages/admin/courses/pending-lessons-view", { lesson, moment });
    }
    catch(err){
      console.log(err);
    }
  }
  admin_pending_lessons_publish_put = async (req,res) => {
    try{
      const lesson = await Lesson.findByIdAndUpdate(req.params.id, {
        status: "Published"
      }, { new: true }).populate({
        path: 'course',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          populate: {
            path: 'user',
            select: 'name'
          }
        }
      });
      // إضافة إشعار للمعلم
      const notification = await Notification.create({
        recipient: lesson.course.teacher.user._id,
        sender: req.user._id,
        title: "Lesson Published",
        message: `Your lesson "${lesson.title}" has been published.`,
      });
      // إضافة إشعار للطالب
      const enrollments = await Enrollment.find({ course: lesson.course._id }).populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name'
        }
      });
      for (const enrollment of enrollments) {
        await Notification.create({
          recipient: enrollment.student.user._id,
          sender: req.user._id,
          title: "Lesson Published",
          message: `A new lesson "${lesson.title}" has been published in your course.`,
          link: `/courses/${lesson.course._id}/lessons/${lesson._id}`, // رابط الدرس
        });
      }
      req.flash('success', 'Lesson published successfully');
      res.redirect("/admin/pending-lessons");

    }
    catch(err){
      console.log(err);
    }

  }
  admin_pending_lessons_reject_put = async (req,res) => {
    try{
      const lesson = await Lesson.findByIdAndUpdate(req.params.id, {
        status: "Rejected",
        rejectionReason: req.body.rejectionReason
      }, { new: true }).populate({
        path: 'course',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          populate: {
            path: 'user',
            select: 'name'
          }
        }
      });
      // إضافة إشعار للمعلم
      const notification = await Notification.create({
        recipient: lesson.course.teacher.user._id,
        sender: req.user._id,
        title: "Lesson Rejected",
        message: `Your lesson "${lesson.title}" has been rejected. Reason: ${req.body.rejectionReason}`,
      });
      req.flash('success', 'Lesson rejected successfully');
      res.redirect("/admin/pending-lessons");

    }
    catch(err){
      console.log(err);
    }

  }

  admin_courses_lessons_view_get = async (req,res) => {
    try{
      const lesson = await Lesson.findById(req.params.id).populate({

        path: 'course',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          populate: {
            path: 'user',
            select: 'name'
          }
        }
      });
      res.render("pages/admin/courses/course-lesson-view", { lesson, moment });
    }
    catch(err){
      console.log(err);
    }
  }

  admin_course_lessons_reject_put = async (req,res) => {
    try{
      const lesson = await Lesson.findByIdAndUpdate(req.params.id, {
        status: "Rejected",
        rejectionReason: req.body.rejectionReason
      }, { new: true });
      req.flash('success', 'Lesson rejected successfully');    
      res.redirect("/admin/courses");

    }
    catch(err){
      console.log(err);


    }
  }

module.exports = {
  admin_pending_lessons_get,
  admin_pending_lessons_view_get,
  admin_pending_lessons_publish_put,
  admin_pending_lessons_reject_put,
  admin_courses_lessons_view_get,
  admin_course_lessons_reject_put
};