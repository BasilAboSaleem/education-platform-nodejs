const { User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, upload, cloudinary, fs, teacher,
  path, enrollment, Parser, send
} = require('./utils');

teacher_addCourse_get = async (req, res) => {
    try{
        const teacher = await Teachers.findOne({user: req.user._id});
        if(teacher.status !== "Active"){
            req.flash("error", "Your account is not active yet, please wait for admin approval.");
            return res.redirect("/dashboard");
        }
        const categories = await Category.find({ status: "Active"});
        res.render("pages/teacher/add-course", { categories: categories });


    }
    catch(err){
        console.log(err);
    }

}
teacher_addCourse_post = async (req, res) => {
    try {
        cloudinary.uploader.upload(req.file.path, { folder: "LMS/courses" }, async (err, result) => {
            if (err) {
                req.flash("error", "Error uploading image, please try again.");
                return res.redirect("/teacher/add-course");
            }

            const uploadedImage = result.secure_url;

            //  البحث عن المعلم المرتبط بالمستخدم الحالي
            const teacher = await Teachers.findOne({ user: req.user._id }).populate({ path: 'user', model: 'User' , select: 'name email' });

            if (!teacher) {
                req.flash("error", "Teacher not found.");
                return res.redirect("/teacher/add-course");
            }

            // إنشاء الكورس باستخدام ID المعلم الصحيح
            const newCourse = await Course.create({
                title: req.body.title,
                description: req.body.description,
                price: req.body.price,
                image: uploadedImage,
                category: req.body.category,
                teacher: teacher._id,
                status: "Under Review",
            });

            // تحديث مصفوفة الكورسات في وثيقة المعلم
            await Teachers.findByIdAndUpdate(
                teacher._id,
                { $push: { courses: newCourse._id } },
                { new: true }
            );

            //ارسال اشعار للأدمن 
            const admin = await User.findOne({ role: "Admin" });
            if (admin) {
                const notification = {
                    title: "New Course Added",
                    message: `A new course titled "${newCourse.title}" has been added by ${teacher.user.name}.`,
                    recipient: admin._id,
                    sender: teacher.user._id,
                    targetRole: "admin",
                    course: newCourse._id,
                    link: '/admin/pending-courses',
                };
                await Notification.create(notification);
            }

            // حذف الصورة من السيرفر المحلي بعد الرفع
            fs.unlinkSync(req.file.path);

            req.flash("success", "Course added successfully");
            res.redirect("/teacher/courses");
        });

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong.");
        res.redirect("/teacher/add-course");
    }
};
teacher_courses_get = async (req, res) => {
    try{
        const teacher = await Teachers.findOne({user: req.user._id});
        const courses = await Course.find({ teacher: teacher._id }).populate("category").populate("teacher");
        
        res.render("pages/teacher/courses", { courses: courses });
       
    }catch(err){
        console.log(err);
    }
}
teacher_course_view_get = async (req, res) => {
    try{
        const course = await Course.findById(req.params.id)  .populate({
            path: 'teacher',  
            populate: {
              path: 'user', // هذا الحقل داخل كل كورس
              model: 'User'
            }
          }).populate("category");
     
        res.render("pages/teacher/course_view", { course: course , moment: moment });

    }
    catch(err){
        console.log(err);
    }
}
teacher_course_edit_get = async (req, res) => {
    try{
        const course = await Course.findById(req.params.id).populate("category").populate("teacher");
        const categories = await Category.find({status: "Active"});
        res.render("pages/teacher/courses_edit", { course: course , moment: moment, categories: categories });

    }
    catch(err){
        console.log(err);
    }
}
teacher_course_edit_put = async (req, res) => {
    try {
      cloudinary.uploader.upload(req.file.path, { folder: "LMS/courses" }, async (err, result) => {
        if (err) {
          req.flash("error", "Error uploading image please try again");
          return res.redirect("/teacher/courses/edit/" + req.params.id);
        }
  
        const uploadedImage = result.secure_url;
        const teacher = await Teachers.findOne({ user: req.user._id });
        if (!teacher) {
          req.flash("error", "Teacher not found.");
          return res.redirect("/teacher/courses/edit/" + req.params.id);
        }
  
        // 1. تحديث الكورس
        const updatedCourse = await Course.findByIdAndUpdate(
          req.params.id,
          {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            image: uploadedImage,
            category: req.body.category,
            teacher: teacher._id,
            status: "Under Review",
          },
          { new: true } // هذا مهم جدًا عشان يرجعلك الكورس بعد التحديث مباشرة
        );

  
        // 2. ربط الكورس بالمعلم
        await Teachers.findByIdAndUpdate(teacher._id, {
          $addToSet: { courses: updatedCourse._id }
        });
  
        fs.unlinkSync(req.file.path);
  
        req.flash("success", "Course updated successfully");
        res.redirect("/teacher/courses");
      });
  
    } catch (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      res.redirect("/teacher/courses");
    }
  }

  
teacher_course_delete = async (req, res) => {
    try{
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            req.flash("error", "Course not found.");
            return res.redirect("/teacher/courses");
        }
        // Remove the course ID from the teacher's courses array
        await Teachers.findByIdAndUpdate(course.teacher, { $pull: { courses: course._id } });
        
        req.flash("success", "Course deleted successfully.");
        res.redirect("/teacher/courses");

    }
    catch(err){
        console.log(err);
    }
}
teacher_course_status_put = async (req, res) => {
    try{
        const course = await Course.findById(req.params.id)
        if (!course) {
            req.flash("error", "Course not found.");
            return res.redirect("/teacher/courses");
        }
        if(course.status === "Published"){
            course.status = "Closed";

        } else if(course.status === "Closed") {
            course.status = "Published";
        }
        await course.save();
        req.flash("success", `Course status updated to ${course.status}.`);
        res.redirect("/teacher/courses");
    }
    catch(err){
        console.log(err);
    }
}

  module.exports = {
    teacher_addCourse_get,
    teacher_addCourse_post,
    teacher_courses_get,
    teacher_course_view_get,
    teacher_course_edit_get,
    teacher_course_edit_put,
    teacher_course_delete,
    teacher_course_status_put
  };