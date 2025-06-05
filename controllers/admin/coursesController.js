const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');


  admin_pending_courses_get = async (req, res) => {
    try {
      const courses = await Course.find({ status: "Under Review" }).populate({
        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name',  // تأكد من جلب الاسم فقط
          model: 'User'    // تحديد نموذج المستخدم بشكل صريح
        }
      }).sort({ createdAt: -1 }).lean(); 
      courses.forEach((course, i) => {
        if (!course.teacher) {
          console.log(`Course ${i} is missing teacher`);
        } else if (!course.teacher.user) {
          console.log(`Course ${i} teacher is missing user`);
        } else {
          console.log(`Course ${i} => ${course.teacher.user.name}`);
        }
      }); // استخدام lean للحصول على بيانات جافة (JSON)
  
      console.log(courses);  // تحقق من أن الكورسات تحتوي على معلمين وبيانات المستخدمين
      res.render("pages/admin/courses/pending-courses", { courses, moment });
    } catch (err) {
      console.log(err);
    }
  };

  admin_pending_courses_view_get = async (req, res) => {
    try{
      const course = await Course.findById(req.params.id).populate({
        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name',
          model: 'User'
        }
      });
      res.render("pages/admin/courses/pending-course-view", { course, moment });

    }
    catch(err){
      console.log(err);
    }
  }
  
  admin_pending_courses_publish_put = async (req, res) => {
    try{
      const course = await Course.findByIdAndUpdate(req.params.id, {
        status: "Published"
      }, { new: true }).populate({
        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name'
        }
      });
      // إرسال إشعار للمعلم
      const notification = await Notification.create({
        title: "Course Published",
        message: `Your course "${course.title}" has been published.`,
        recipient: course.teacher.user._id,
        sender: req.user._id, 
        course: course._id,
        link: `/teacher/courses/${course._id}`,
      });
      req.flash('success', 'Course published successfully');
      res.redirect("/admin/pending-courses");

    }
    catch(err){
      console.log(err);
    }
  }

  admin_pending_courses_reject_put = async (req, res) => {
    try{
      const course = await Course.findByIdAndUpdate(req.params.id, {
        status: "Rejected",
        rejectionReason: req.body.rejectionReason
      }, { new: true }).populate({
        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name'
        }
      });
      // إرسال إشعار للمعلم
      const notification = await Notification.create({
        title: "Course Rejected",
        message: `Your course "${course.title}" has been rejected. Reason: ${req.body.rejectionReason}`,
        recipient: course.teacher.user._id,
        sender: req.user._id, 
        course: course._id,
        link: `/teacher/courses/${course._id}`,
      });
      req.flash('success', 'Course rejected successfully');
      res.redirect("/admin/pending-courses");

    }
    catch(err){
      console.log(err);
    }

  }

  admin_courses_get = async (req,res) => {
    try{
      const courses = await Course.find().populate({
        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name',  // تأكد من جلب الاسم فقط
          model: 'User'    // تحديد نموذج المستخدم بشكل صريح
        }
      }).sort({ createdAt: -1 }).lean(); 
         res.render("pages/admin/courses/courses", { courses, moment });
    }
    catch(err){
        console.log(err)
    }
  }
  admin_courses_view_get = async (req,res) => {
    try{
      const course = await Course.findById(req.params.id).populate({

        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name',
          model: 'User'
        }
      });
      res.render("pages/admin/courses/course-view", { course, moment });
    }
    catch(err){
        console.log(err)
    }
  }
  admin_courses_lessons_get = async (req,res) => {
    try{
      const lessons = await Lesson.find({ course: req.params.id }).populate('course').sort({ createdAt: -1 }).lean();
      const course = await Course.findById(req.params.id);
    
      res.render("pages/admin/courses/course-lesoons", { course, lessons, moment });
    } catch(err) {
      console.log(err);
    }
  }
  admin_courses_search_get = async (req,res) => {
    try{
      const courses = await Course.find().populate({

        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name',
          model: 'User'
        }
      }).sort({ createdAt: -1 }).lean();
      res.render("pages/admin/courses/courses", { courses, moment });
    }
    catch(err){
        console.log(err)
    }
  }
  admin_courses_search_post = async (req, res) => {
    try {
      const query = req.body.query?.trim();  
      if (!query) {
        return res.redirect("/admin/courses");
      }
  
      const courses = await Course.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { status: { $regex: query, $options: 'i' } },
         
        ]
      }).populate({
        path: 'teacher',
        populate: {
          path: 'user',
          select: 'name',
          model: 'User'
        }
      }).populate('category').sort({ createdAt: -1 }).lean(); // استخدام populate لجلب بيانات المعلم والفئة
      //  فلترة النتائج حسب اسم المعلم
const filteredCourses = courses.filter(course =>
  course.teacher?.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
  course.category?.name?.toLowerCase().includes(query.toLowerCase())
);
      res.render("pages/admin/courses/course-serch", { courses, filteredCourses, moment });
    }
    catch (err) {
      console.error("Error searching courses:", err);
    }
  }

  admin_courses_status_put = async (req, res) => {
    try{
      const course = await Course.findOne({ _id: req.params.id });
      if (!course) {
        return res.status(404).send("Course not found");
      }
      let newStatus;
      if (course.status === "Published") {
        newStatus = "Closed";
      } else if (course.status === "Closed") {
        newStatus = "Published";
      } else {
        req.flash("error", "Cannot change course status from this state.");
      }
      course.status = newStatus;
      await course.save();
      req.flash('success', `Course status updated to ${newStatus}`); // تخزين رسالة النجاح في الجلسة
      res.redirect("/admin/courses"); 
    }
    catch(err){
      console.log(err);
    }
  }

  module.exports = {
    admin_pending_courses_get,
    admin_pending_courses_view_get,
    admin_pending_courses_publish_put,
    admin_pending_courses_reject_put,
    admin_courses_get,
    admin_courses_view_get,
    admin_courses_lessons_get,
    admin_courses_search_get,
    admin_courses_search_post,
    admin_courses_status_put
  };