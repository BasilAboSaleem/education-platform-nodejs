const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");
const Category = require("../models/Category");
const Course = require("../models/course");
const Lesson = require("../models/lesson");
const Payment = require("../models/payment");
const Enrollment = require("../models/enrollment");
const Notification = require("../models/notification");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const moment = require('moment');
const multer  = require('multer')
const upload = multer({storage: multer.diskStorage({})});
const cloudinary = require("cloudinary").v2;
require('dotenv').config();
const fs = require('fs');
const { model } = require("mongoose");
const path = require("path");
const { Parser } = require('json2csv');
const { send, title } = require("process");


 // Configuration cloudinary اعدادات الكلاودنري
 cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET 
});



admin_students_get = async (req,res) => {
    try{
        const students = await Student.find().populate('user').sort({createdAt: -1}).lean() //populate هيك صار يدمج مودل اليوزر مع مودل الستودنت وبقدر اوصل لبيانات الاثنين lean سرعة في عرض البيانات sort ترتيب حسب التاريخ الاحدث فوق والاقدم تحت
        res.locals.students = students
        res.render("pages/admin/students/students", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت

    }
    catch(err){
        console.log(err)
    }


}
admin_students_view_get = async (req,res) => {
    try{
        const student = await Student.findById(req.params.id).populate('user').lean()
        res.locals.student = student
        res.render("pages/admin/students/student_view", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت
    }
    catch(err){
        console.log(err)
    }
   
}

admin_students_edit_get = async (req,res) => {
    try{
        const student = await Student.findById(req.params.id).populate('user').lean()
        res.locals.student = student
        res.render("pages/admin/students/student_edit", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت
    }
    catch(err){
        console.log(err)
    }
}
admin_students_edit_put = async (req,res) => {
    try{
        const student = await Student.findById(req.params.id).populate('user')
        //تحديث الحقول في الستيودنت سكيما 
        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true })
        //تحديث الحقول في اليوزر سكيما
        const updatedUser = await User.findByIdAndUpdate(student.user._id, {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,

        }, { new: true })
        res.redirect("/admin/students")


    }
    catch(err){
        console.log(err)
    }
}
admin_students_delete = async (req,res) => {
    try{
        const student = await Student.findById(req.params.id).populate('user')
        //حذف اليوزر من اليوزر سكيما
        await User.findByIdAndDelete(student.user._id)
        //حذف الستيودنت من الستيودنت سكيما
        await Student.findByIdAndDelete(req.params.id)
        res.redirect("/admin/students")

    }
    catch(err){
        console.log(err)
    }
}
admin_students_status_put = async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);
  
      let newStatus;
      if (student.status === "Pending") {
        newStatus = "Active";
      } else if (student.status === "Active") {
        newStatus = "Inactive";
      } else {
        newStatus = "Pending";
      }
  
      await Student.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
  
      res.redirect("/admin/students");    
    } catch (err) {
      console.log(err);
      res.redirect("/admin/students"); // حتى لو في خطأ، ما توقف الصفحة
    }
  }
  admin_students_search_post = async (req, res) => {
    try {
      const query = req.body.query?.trim();  
      if (!query) {
        return res.render("pages/admin/students/student_search", { students: [], moment });
      }
  
      let students = await Student.find({}).populate('user'); // بدون شروط بحث هنا
  
      // نفلتر النتائج بعد الـ populate
      students = students.filter(student => {
        const nameMatch = student.user?.name?.toLowerCase().includes(query.toLowerCase());
        const emailMatch = student.user?.email?.toLowerCase().includes(query.toLowerCase());
        const phoneMatch = student.phone?.toLowerCase().includes(query.toLowerCase());
        const statusMatch = student.status?.toLowerCase().includes(query.toLowerCase());
        return nameMatch || emailMatch || phoneMatch || statusMatch;
      });  
      res.render("pages/admin/students/student_search", { students, moment });
    } catch (err) {
      console.error("Error during student search:", err);
      res.status(500).send("There was an error while searching.");
    }
  };
  
  admin_teachers_get = async (req,res) => {
    try{
      const teachers= await Teachers.find().populate('user').sort({createdAt: -1}).lean() //populate هيك صار يدمج مودل اليوزر مع مودل الستودنت وبقدر اوصل لبيانات الاثنين lean سرعة في عرض البيانات sort ترتيب حسب التاريخ الاحدث فوق والاقدم تحت
      res.locals.teachers = teachers
      res.render("pages/admin/teachers/teachers", {moment: moment})
    }
    
    catch(err){
        console.log(err)
    } 
  }
    
  admin_teachers_view_get = async (req,res) => {
    try{
      const teacher = await Teachers.findById(req.params.id).populate('user').lean()
      res.locals.teacher = teacher
      res.render("pages/admin/teachers/teacher_view", {moment: moment})

    }
    catch(err){
        console.log(err)
    }
  }
  admin_teachers_edit_get = async (req,res) => {
    try{
      const teacher = await Teachers.findById(req.params.id).populate('user').lean()
      res.locals.teacher = teacher
      res.render("pages/admin/teachers/teacher_edit", {moment: moment})

    }
    catch(err){
        console.log(err)
    }
  }
  admin_teachers_edit_put = async (req,res) => {
    try{
       const teacher = await Teachers.findById(req.params.id).populate('user')
       //تحديث الحقول في التيتشر سكيما
       const updatedTeachrt = await Teachers.findByIdAndUpdate(req.params.id, req.body, { new: true })
        //تحديث الحقول في اليوزر سكيما
        const updatedUser = await User.findByIdAndUpdate(teacher.user._id, {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,

        }, { new: true })
        res.redirect("/admin/teachers")

    }
    catch(err){
        console.log(err)
    }
  }
    
  admin_teachers_delete = async (req,res) => {
    try{
      const teacher = await Teachers.findById(req.params.id).populate('user')
      //حذف اليوزر من اليوزر سكيما
      await User.findByIdAndDelete(teacher.user._id)
      //حذف الستيودنت من التيتشر  سكيما
      await Teachers.findByIdAndDelete(req.params.id)
      res.redirect("/admin/teachers")

    

    }
    catch(err){
        console.log(err)
    }
  }
  admin_teachers_status_put = async (req, res) => {
    try{
      const teacher = await Teachers.findById(req.params.id);
  
      let newStatus;
      if (teacher.status === "Pending") {
        newStatus = "Active";
      } else if (teacher.status === "Active") {
        newStatus = "Inactive";
      } else {
        newStatus = "Pending";
      }
  
      await Teachers.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
  
      res.redirect("/admin/teachers");    

    }
    catch(err){
        console.log(err)
    }
  }
  admin_teachers_search_post = async (req, res) => {
    try {
      const query = req.body.query?.trim();  
      if (!query) {
        return res.render("pages/admin/teachers/teacher_search", { teachers: [], moment });
      }
  
      let teachers = await Teachers.find({}).populate('user'); // بدون شروط بحث هنا
  
      // نفلتر النتائج بعد الـ populate
      teachers = teachers.filter(teacher => {
        const nameMatch = teacher.user?.name?.toLowerCase().includes(query.toLowerCase());
        const emailMatch = teacher.user?.email?.toLowerCase().includes(query.toLowerCase());
        const phoneMatch = teacher.phone?.toLowerCase().includes(query.toLowerCase());
        const statusMatch = teacher.status?.toLowerCase().includes(query.toLowerCase());
        const expertiseMatch = teacher.expertise?.some(exp => exp.toLowerCase().includes(query.toLowerCase()));
        return nameMatch || emailMatch || phoneMatch || statusMatch || expertiseMatch;
      });  
      res.render("pages/admin/teachers/teacher_search", { teachers, moment });
    }  catch (err) {
      console.error("Error searching teachers:", err);
      res.status(500).send("There was an error while searching teachers.");
    }
  };
  admin_add_teacher_get = async (req,res) => {
    try{
        res.render("pages/admin/teachers/add-teacher")
    }
    catch(err){
        console.log(err)
    }
  }
  admin_add_teacher_post = async (req,res) => {
    try{
      //فحص الايميل المدخل هل موجود مسبقا ام لا 
      const exsistingEmail = await User.findOne({email: req.body.email})
      if(exsistingEmail){
        console.log("Email already exists");
        return res.json({exsistingEmail: "Email already exists"})
      }
      //فحص الباسوورد هل مطابقة للشروط ام لا 
      const objErr = validationResult(req) 
      if(objErr.errors.length >0){
        console.log(objErr);
        return res.json({objErr: objErr.errors})
      }
      
      //ننشئ يوزر من البيانات المدخلة
      const newTeacher = await User.create(req.body)
      //ننشء معلم وبرسل معه اليوزر باستخدام اليوزر الجديد
      const teacher = await Teachers.create({user: newTeacher._id})
      console.log("New teacher added:", teacher);
      req.flash('success', 'Teacher added successfully'); // تخزين رسالة النجاح في الجلسة
      return res.json({ success: true, redirectTo: "/admin/teachers" }); // Redirect the user on success



    
    }
    catch(err){
        console.log(err)
    }
  }
admin_teachers_search_get = async (req,res) => {
    try{
      const teachers = await Teachers.find().populate('user').sort({createdAt: -1}).lean() //populate هيك صار يدمج مودل اليوزر مع مودل الستودنت وبقدر اوصل لبيانات الاثنين lean سرعة في عرض البيانات sort ترتيب حسب التاريخ الاحدث فوق والاقدم تحت
      res.locals.teachers = teachers
        res.render("pages/admin/teachers/teacher_search", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت
    }
    catch(err){
        console.log(err)
    }
  }

  admin_add_category_get = (req,res) => {
    res.render("pages/admin/categories/add-categorie")
  }
  admin_add_category_post = async (req, res) => {
    try {
      cloudinary.uploader.upload(req.file.path,{folder: "LMS/categoriesImge"} ,async (error, result) => {
        if (error) {
          console.error("Error uploading image to Cloudinary:", error);
          return res.status(500).send("Error uploading image");
        }
  
        const uploadedImage = result.secure_url; // رابط الصورة المرفوعة
        req.body.image = uploadedImage; // إضافة رابط الصورة إلى البيانات المدخلة
        //التاكد من عدم تكرار الاسم 
        const existingCategory = await Category.findOne({ name: req.body.name });
        if (existingCategory) {
          console.log("Category name already exists");
          //اظهار رسالة الخطا للمسخدم في الواجهة
          req.flash('error', 'Category name already exists'); // تخزين رسالة الخطأ في الجلسة
          return res.redirect('/admin/categories/add-category'); // إعادة التوجيه مع رسالة الخطأ
        }
        const newCategory = await Category.create({
          name: req.body.name,
          description: req.body.description,
          image: uploadedImage,
        });
        fs.unlinkSync(req.file.path); // حذف الملف المؤقت
        //اظهار رسالة النجاح للمستخدم في الفرونت
        req.flash('success', 'Category added successfully'); // تخزين رسالة النجاح في الجلسة


        console.log("New category added:", newCategory);
        res.redirect("/admin/categories");
      });
  
    } catch (err) {
      console.log(err);
      res.status(500).send("Error while adding category");
    }
  };
  admin_categories_get = async (req,res) => {
    try{
      const categories = await Category.find().sort({createdAt: -1}).lean() // هlean سرعة في عرض البيانات sort ترتيب حسب التاريخ الاحدث فوق والاقدم تحت
      res.locals.categories = categories
        res.render("pages/admin/categories/categories", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_view_get = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id).lean()
      res.locals.category = category
      res.render("pages/admin/categories/categories_view", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_edit_get = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id).lean()
      res.locals.category = category
      res.render("pages/admin/categories/categories_edite", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت

    }
    catch(err){
        console.log(err)
    }

  }
  admin_categories_edit_put = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id)
      //فحص اذا تم رفع صورة جديدة ام لا 
      if(req.file){
        cloudinary.uploader.upload(req.file.path,{folder: "LMS/categoriesImge"} ,async (error, result) => {
          if (error) {
            console.error("Error uploading image to Cloudinary:", error);
            return res.status(500).send("Error uploading image");
          }
          const uploadedImage = result.secure_url; // رابط الصورة المرفوعة
          req.body.image = uploadedImage; // إضافة رابط الصورة إلى البيانات المدخلة
          const updatedCategory = await Category.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            description: req.body.description,
            status: req.body.status,
            image: uploadedImage,
          }, { new: true });
          fs.unlinkSync(req.file.path); // حذف الملف المؤقت
          res.redirect("/admin/categories")
        });
      }else{
        //اذا لم يتم تحديث الصورة حدث هدول وبس
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, {
          name: req.body.name,
          description: req.body.description,
          status: req.body.status,
        }, { new: true });
        res.redirect("/admin/categories")
      }

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_delete = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id)
      //حذف الصورة من الكلاودنري
      const publicId = category.image.split('/').pop().split('.')[0]; // استخراج الـ public_id من رابط الصورة
      await cloudinary.uploader.destroy(`LMS/categoriesImge/${publicId}`); // حذف الصورة من Cloudinary
      //حذف الفئة من قاعدة البيانات
      await Category.findByIdAndDelete(req.params.id)
      res.redirect("/admin/categories")

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_status_put = async (req, res) => {
    try{
      const categorie = await Category.findById(req.params.id);
      if(categorie.status === "Active"){
        await Category.findByIdAndUpdate(req.params.id, { status: "Inactive" }, { new: true });
      } else {
        await Category.findByIdAndUpdate(req.params.id, { status: "Active" }, { new: true });
      }
      res.redirect("/admin/categories");

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_search_get = async (req,res) => {
    try{
      const categories = await Category.find().sort({createdAt: -1}).lean() //populate هيك صار يدمج مودل اليوزر مع مودل الستودنت وبقدر اوصل لبيانات الاثنين lean سرعة في عرض البيانات sort ترتيب حسب التاريخ الاحدث فوق والاقدم تحت
      res.locals.categories = categories
        res.render("pages/admin/categories/categories_search", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت


    }
    catch(err){
      console.log(err);
    }
  }
  
  admin_categories_search_post = async (req, res) => {
    try{
      const query = req.body.query?.trim()
      if (!query) {
        return res.render("pages/admin/categories/categories_search", { categories: [], moment });
      }


      const categories = await Category.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
         
        ]
      }).sort({ createdAt: -1 }).lean();
      res.render("pages/admin/categories/categories_search", { categories, moment });
    }
    catch(err){
        console.log(err)
    }
  }

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
        course: course.title,
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
        course: course.title,
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
      // ✅ فلترة النتائج حسب اسم المعلم
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

  admin_payments_get = async (req,res) => {
    try{
      const payments = await Payment.find().populate({
         path: 'enrollment',
  populate: [
    {
      path: 'student',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name email',
      }
    },
    {
      path: 'course',
      model: 'Course'
    }
  ]
});
      // إضافة تجميع المدفوعات التي تمت 
      const result = await Payment.aggregate([
        {
         $match: { paymentStatus: { $in: ['paid', 'unpaid'] } }// فقط المدفوعات المكتملة
        },
        {
          $group: {
            _id: null,
            totalPayment: { $sum: "$amount" }
          }
        }
      ]);
      //اضافة مجموع المدفوعات المتوقعة البنديح
      const result2 = await Payment.aggregate([
        {
          $match: { paymentStatus: 'unpaid' } // فقط المدفوعات المكتملة
        },
        {
          $group: {
            _id: null,
            totalPayment: { $sum: "$amount" }
          }
        }
      ]);
      // $match: { paymentStatus: 'paid' }  فقط المدفوع
      const result3 = await Payment.aggregate([
        {
          $match: { paymentStatus: 'paid' } // فقط المدفوعات المكتملة
        },
        {
          $group: {
            _id: null,
            totalPayment: { $sum: "$amount" }
          }
        }
      ]);
      // تجميع المدفوعات حسب اسم الكورس
const paymentByCourse = await Payment.aggregate([
  {
    // نربط بين Collection المدفوعات (Payment) والانرولمنتس (Enrollments)
    $lookup: {
      from: 'enrollments',               // الكولكشن الثاني اللي بدنا نربط معه
      localField: 'enrollment',          // الحقل في وثيقة Payment اللي يحتوي ObjectId لـ enrollment
      foreignField: '_id',               // الحقل في وثيقة Enrollment اللي راح نطابق عليه
      as: 'enrollment'                   // اسم الحقل الجديد اللي راح يحتوي بيانات الانرولمنت المطابقة
    }
  },
  {
    // لأن $lookup بيرجع مصفوفة، نستخدم $unwind لتحويلها إلى كائن واحد بدل مصفوفة
    $unwind: "$enrollment"
  },
  {
    // نربط الآن بين enrollment الموجود داخل كل payment وبين جدول الكورسات
    $lookup: {
      from: 'courses',                   // الكولكشن الثاني (Courses)
      localField: 'enrollment.course',   // الحقل داخل enrollment اللي فيه ObjectId الكورس
      foreignField: '_id',               // الحقل في Course اللي راح نطابق عليه
      as: 'course'                       // اسم الحقل الجديد اللي راح يحتوي الكورس المرتبط
    }
  },
  {
    // نفس الشي، نحول مصفوفة الكورسات إلى كائن واحد
    $unwind: "$course"
  },
  {
    // الآن نبدأ بتجميع النتائج لكل كورس
    $group: {
      _id: "$course._id",                      // كل كورس يكون مجموعة مستقلة حسب ID تبعه
      courseTitle: { $first: "$course.title" },// نأخذ عنوان الكورس من أول وثيقة (كلها نفس العنوان)
      totalPayment: { $sum: "$amount" },       // مجموع كل المبالغ المدفوعة أو غير المدفوعة لهذا الكورس
      pendingPayment: {
        $sum: {
          $cond: [                              // إذا الحالة unpaid، أضف المبلغ، غير هيك أضف 0
            { $eq: ["$paymentStatus", "unpaid"] },
            "$amount",
            0
          ]
        }
      },
      successfulPayment: {
        $sum: {
          $cond: [                              // إذا الحالة paid، أضف المبلغ، غير هيك أضف 0
            { $eq: ["$paymentStatus", "paid"] },
            "$amount",
            0
          ]
        }
      },
      studentCount: { $addToSet: "$enrollment.student" } // نخزن معرفات الطلاب المرتبطين بهذا الكورس (بدون تكرار)
    }
  },
  {
    // عرض النتيجة النهائية، وعدد الطلاب نحسبه من حجم المصفوفة
    $project: {
      courseTitle: 1,
      totalPayment: 1,
      pendingPayment: 1,
      successfulPayment: 1,
      studentCount: { $size: "$studentCount" }  // حساب عدد الطلاب الفعليين المسجلين
    }
  }
]);

      const totalPayment = result[0]?.totalPayment || 0;
      const pendingPayment = result2[0]?.totalPayment || 0;
      const successfullyPayment = result3[0]?.totalPayment || 0;

const unpaidPayments = payments.filter(payment => payment.paymentStatus === 'unpaid');
const paidPayments = payments.filter(payment => payment.paymentStatus === 'paid');

res.render("pages/admin/payments/paymentReporte",
   { payments, totalPayment, pendingPayment, successfullyPayment, paymentByCourse, unpaidPayments, paidPayments, moment });

    }
    catch(err){
      console.log(err);
    }
  }

  admin_payments_view_get = async (req,res) => {
    try{
      const payment = await Payment.findById(req.params.id).populate({
        path: 'enrollment',
        populate:{
          path: 'student',
          populate: {
            path: 'user',
            select: 'name email'
          }
        }
      }).populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          populate: {
            path: 'teacher',
            populate: {
              path: 'user',
              select: 'name email'
            }
          }
        }
      });

      res.render("pages/admin/payments/paymentView", { payment, moment });

    }
    catch(err){
      console.log(err);
    }

  }

  admin_payments_export_get = async (req,res) => {
    try{
      const payments = await Payment.find().populate({
        path: 'enrollment',
        populate: [
          {
            path: 'student',
            populate: {
              path: 'user',
              select: 'name email'
            }
          },
          {
            path: 'course',
            model: 'Course'
          }
        ]
      });

      // تهيئة البيانات بطريقة بسيطة
    const csvData = payments.map(payment => ({
      studentName: payment.enrollment.student.user.name,
      studentEmail: payment.enrollment.student.user.email,
      courseTitle: payment.enrollment.course.title,
      amount: payment.amount,
      status: payment.paymentStatus,
      method: payment.paymentMethod,
      date: payment.createdAt.toLocaleDateString(),
    }));

    // توليد CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    // إعداد الرد ليكون ملف قابل للتحميل
    res.header('Content-Type', 'text/csv');
    res.attachment('payments.csv');
    return res.send(csv);


    }
    catch(err){
      console.log(err);
    }

  }

  admin_payments_view_course_get = async (req,res) => {
    try{
      const courseId = req.params.id;
      const payment = await Payment.find().populate({
  path: 'enrollment',
  populate: {
    path: 'student',
    populate: {
      path: 'user',
      select: 'name email',
      model: 'User',
    }
  }
})
      .populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          model: 'Course',
          match: { _id: courseId },

        }
      });
      // فلترة المدفوعات التي تتعلق بالكورس المحدد
      const filteredPayments = payment.filter(p => p.enrollment.course && p.enrollment.course._id.toString() === courseId);
      // إذا لم يكن هناك مدفوعات، يمكن عرض رسالة أو شيء آخر
      if (filteredPayments.length === 0) {
        req.flash('error', 'No payments found for this course'); // تخزين رسالة الخطأ في الجلسة
        return res.redirect("/admin/payments");
      }

      res.render("pages/admin/payments/paymentViewCourse", {filteredPayments, moment });

    }
    catch(err){
      console.log(err);
    }
  }
  
admin_payments_paymentsByCourse_export_get = async (req, res) => {
  try {
    // 1. جميع المدفوعات مع التفاصيل
    const payments = await Payment.find().populate({
      path: 'enrollment',
      populate: [
        {
          path: 'student',
          populate: {
            path: 'user',
            select: 'name email'
          }
        },
        {
          path: 'course',
          model: 'Course'
        }
      ]
    });

    // 2. نحسب عدد الطلاب لكل كورس (بدون تكرار)
    const enrollments = await Enrollment.find();
    const studentCountMap = {};

    enrollments.forEach(enroll => {
      const courseId = enroll.course.toString();
      const studentId = enroll.student.toString();

      if (!studentCountMap[courseId]) {
        studentCountMap[courseId] = new Set();
      }
      studentCountMap[courseId].add(studentId);
    });

    // 3. تجهيز البيانات لـ CSV
    const csvData = payments.map(payment => {
      const course = payment.enrollment?.course;
      const courseId = course?._id?.toString();
      const numberOfStudents = studentCountMap[courseId]?.size || 0;

      return {
        courseTitle: course?.title || 'Unknown',
        numberOfStudents,
        totalAmount: payment.amount,
        successfulPayments: payment.paymentStatus === 'paid' ? payment.amount : 0,
        pendingPayments: payment.paymentStatus === 'unpaid' ? payment.amount : 0,
      };
    });

    // 4. توليد CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    // 5. إرسال الملف كـ CSV
    res.header('Content-Type', 'text/csv');
    res.attachment('paymentsByCourse.csv');
    return res.send(csv);

  } catch (err) {
    console.error('Export CSV Error:', err);
    res.status(500).send('Error generating CSV');
  }
};


admin_payments_pendingPayments_export_get = async (req, res) => {
  try{
    // 1. جميع المدفوعات مع التفاصيل
 const payments = await Payment.find({ paymentStatus: 'unpaid' }).populate({
  path: 'enrollment',
  populate: [
    {
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email',
        model: 'User'
      }
    },
    {
      path: 'course',
      model: 'Course'
    }
  ]
});

    // 2. تجهيز البيانات لـ CSV
    const csvData = payments.map(payment => {
      const course = payment.enrollment?.course;
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: course?.title || 'Unknown',
        amount: payment.amount,
        status: payment.paymentStatus,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    // 3. توليد CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

      // 5. إرسال الملف كـ CSV
    res.header('Content-Type', 'text/csv');
    res.attachment('pendingPayments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send('Error generating CSV');
  }
}
admin_payments_successfulPayments_export_get = async (req, res) => {
  try{
    const payments = await Payment.find({ paymentStatus: 'paid' }).populate({
  path: 'enrollment',
  populate: [
    {
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email',
        model: 'User'
      }
    },
    {
      path: 'course',
      model: 'Course'
    }
  ]
});
    const csvData = payments.map(payment => {
      const course = payment.enrollment?.course;
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: course?.title || 'Unknown',
        amount: payment.amount,
        status: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('successfulPayments.csv');
    return res.send(csv);

  }
  catch(err){
    console.log(err);
    res.status(500).send('Error generating CSV');
  }
}
/// notifications ///
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
        targetRole:  expectedRole, // ✅ يجب أن تكون 'student' أو 'teacher',
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


    admin_students_get,
    admin_students_view_get,
    admin_students_edit_get,
    admin_students_edit_put,
    admin_students_delete,
    admin_students_status_put,
    admin_students_search_post,
    admin_teachers_get,
    admin_teachers_view_get,
    admin_teachers_edit_get,
    admin_teachers_edit_put,
    admin_teachers_delete,    
    admin_teachers_status_put,  
    admin_teachers_search_post, 
    admin_add_teacher_get,
    admin_add_teacher_post,
    admin_teachers_search_get,
    admin_add_category_get,
    admin_add_category_post,
    admin_categories_get,
    admin_categories_view_get,
    admin_categories_edit_get,
    admin_categories_edit_put,
    admin_categories_delete,
    admin_categories_status_put,
    admin_categories_search_get,
    admin_categories_search_post,
    admin_pending_courses_get,
    admin_pending_courses_view_get,
    admin_pending_courses_publish_put,
    admin_pending_courses_reject_put,
    admin_courses_get,
    admin_courses_view_get,
    admin_courses_lessons_get,
    admin_courses_search_get,
    admin_courses_search_post,
    admin_courses_status_put,
    admin_pending_lessons_get,
    admin_pending_lessons_view_get,
    admin_pending_lessons_publish_put,
    admin_pending_lessons_reject_put,
    admin_courses_lessons_view_get,
    admin_course_lessons_reject_put,
    admin_payments_get,
    admin_payments_view_get,
    admin_payments_export_get,
    admin_payments_view_course_get,
    admin_payments_paymentsByCourse_export_get,
    admin_payments_pendingPayments_export_get,
    admin_payments_successfulPayments_export_get,
    admin_send_notification_get,
    admin_send_notification_post,
   
    admin_notifications_get,
   }