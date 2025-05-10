const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");
const Course = require("../models/course");
const Lesson = require("../models/lesson");
const Category = require("../models/Category");
const Enrollment = require("../models/enrollment");
const Payment = require("../models/payment");

const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const moment = require('moment');
const multer  = require('multer')
const upload = multer({storage: multer.diskStorage({})});
const cloudinary = require("cloudinary").v2;
require('dotenv').config();
const fs = require('fs');
const teacher = require("../models/teacher");
const path = require("path");
const enrollment = require("../models/enrollment");
 // Configuration cloudinary اعدادات الكلاودنري
 cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
  });
//////////////////////////////////////////////////////////

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

            // ✅ البحث عن المعلم المرتبط بالمستخدم الحالي
            const teacher = await Teachers.findOne({ user: req.user._id });

            if (!teacher) {
                req.flash("error", "Teacher not found.");
                return res.redirect("/teacher/add-course");
            }

            // ✅ إنشاء الكورس باستخدام ID المعلم الصحيح
            const newCourse = await Course.create({
                title: req.body.title,
                description: req.body.description,
                price: req.body.price,
                image: uploadedImage,
                category: req.body.category,
                teacher: teacher._id,
                status: "Under Review",
            });

            // ✅ تحديث مصفوفة الكورسات في وثيقة المعلم
            await Teachers.findByIdAndUpdate(
                teacher._id,
                { $push: { courses: newCourse._id } },
                { new: true }
            );

            // ✅ حذف الصورة من السيرفر المحلي بعد الرفع
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
  

teacher_course_lessons_get = async (req, res) => {
    try{
       
        const course = await Course.findById(req.params.id)
        if(course.status === "Under Review" || course.status === "Rejected"){
            req.flash("error", "Your course is not active yet, please wait for admin approval.");
            return res.redirect(`/teacher/courses/view/${req.params.id}`);
        }
        const lessons = await Lesson.find({course: req.params.id}).populate("course");
        
        res.render("pages/teacher/course-lesoons", { course: course , moment: moment, lessons: lessons });

    }
    catch(err){
        console.log(err);
    }
} 

teacher_course_add_lesson_get = async (req, res) => {
    try{
        const course = await Course.findById(req.params.id);
        res.render("pages/teacher/add-lesson", { course: course });

    }
    catch(err){
        console.log(err);
    }
}

teacher_course_add_lesson_post = async (req, res) => {
    try{
        const newLesson = await Lesson.create({
            title: req.body.title,
            content: req.body.content,
            videoUrl: req.body.videoUrl,
            course: req.params.id,
            order: req.body.order,
            status: "Under Review",
        });
    
        // Update the course with the new lesson ID
        await Course.findByIdAndUpdate(req.params.id, {
            $push: { lessons: newLesson._id }
        }, { new: true }); 
        req.flash("success", "Lesson added successfully");
        console.log(newLesson);

        res.redirect(`/teacher/courses/${req.params.id}/lessons`);
    }
    catch(err){
        console.log(err);
    }
}

teacher_course_lesson_view_get = async (req, res) => {
    try{
        const lesson = await Lesson.findById(req.params.id).populate("course");
        res.render("pages/teacher/lesson_view", { lesson: lesson , moment: moment, course: lesson.course });

    }
    catch(err){
        console.log(err);
    }
}

teacher_course_lesson_edit_get = async (req, res) => {
    try{
        const lesson = await Lesson.findById(req.params.id).populate("course");
        res.render("pages/teacher/edit_lesson", { lesson: lesson , moment: moment, course: lesson.course });

    }
    catch(err){
        console.log(err);
    }
}

teacher_course_lesson_edit_put = async (req, res) => {
    try{
        const lesson = await Lesson.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            content: req.body.content,
            videoUrl: req.body.videoUrl,
            order: req.body.order,
            status: "Under Review",
        }, { new: true }).populate("course");
    
        req.flash("success", "Lesson updated successfully");
        console.log(lesson);
        res.redirect(`/teacher/courses/${lesson.course._id}/lessons`);
    }
    catch(err){
        console.log(err);
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
teacher_student_enrollments_get = async (req, res) => {
    try {

      const teacher = await Teachers.findOne({user: req.user.id}) // المعلم الحالي 
      const searchQuery = req.query.query?.toLowerCase() || ""; // استعلام البحث
  
      let studentEnrollments = await Enrollment.find()
        .populate({
          path: "course",
          match: { teacher: teacher._id }, // فلترة الكورسات التي تخص المعلم فقط يعني شرط
        })
        .populate({
          path: "student",
          populate: {
            path: "user",
            model: "User",
            select: "name email",
          },
        });
         // فلترة حسب حقل البحث الموحد
    if (searchQuery) {
        studentEnrollments = studentEnrollments.filter((enroll) => {
          const studentName = enroll.student.user.name?.toLowerCase() || "";
          const courseTitle = enroll.course.title?.toLowerCase() || "";
          const status = enroll.status?.toLowerCase() || "";
          const createdAt = enroll.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
  
          return (
            studentName.includes(searchQuery) ||
            courseTitle.includes(searchQuery) ||
            status.includes(searchQuery) ||
            createdAt.includes(searchQuery)
          );
        });
      }
      
  
      res.render("pages/teacher/studentEnrollments", { studentEnrollments, moment: moment });
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
  };
  teacher_student_enrollment_view_get = async (req, res) => {
    try{
        const enrollment = await Enrollment.findById(req.params.id)
        .populate({
            path: "student",
            populate: {
              path: "user",
              model: "User",
              select: "name email"
            }
          })
          .populate("course");
        const payment = await Payment.findOne({enrollment: enrollment._id}).populate("enrollment");

        res.render("pages/teacher/enrollmentDetails", { enrollment, payment , moment: moment });
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
    teacher_course_lessons_get,
    teacher_course_add_lesson_get,
    teacher_course_add_lesson_post,
    teacher_course_lesson_view_get,
    teacher_course_lesson_edit_get,
    teacher_course_lesson_edit_put,
    teacher_course_status_put,
    teacher_course_delete,
    teacher_student_enrollments_get,
    
    teacher_student_enrollment_view_get,
};