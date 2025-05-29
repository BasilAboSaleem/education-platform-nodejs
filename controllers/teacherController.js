const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");
const Course = require("../models/course");
const Lesson = require("../models/lesson");
const Category = require("../models/Category");
const Enrollment = require("../models/enrollment");
const Payment = require("../models/payment");
const Notification = require("../models/notification");
const Task = require("../models/task");
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
const { Parser } = require('json2csv');
const { send } = require("process");

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
            const teacher = await Teachers.findOne({ user: req.user._id }).populate({ path: 'user', model: 'User' , select: 'name email' });

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
  
     // جلب جميع كورسات المعلم (نجيب _id فقط)
const courses = await Course.find({ teacher: teacher._id }).select('_id');

// استعلام التسجيلات التي تكون كورساتها ضمن كورسات المعلم فقط
const studentEnrollments = await Enrollment.find({
  course: { $in: courses.map(c => c._id) }
})
.populate({
  path: "course",
  select: "title teacher", // اختيار الحقول التي تريدها
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
teacher_payments_get = async (req, res) => {
  try {
    const searchQuery = req.query.query?.toLowerCase() || "";

    // 1. الحصول على المعلم الحالي
    const teacher = await Teachers.findOne({ user: req.user._id });

    // 2. الحصول على الكورسات التي يملكها هذا المعلم
    const courses = await Course.find({ teacher: teacher._id });
    const courseIds = courses.map(course => course._id);

    // 3. الحصول على الانرولمنتات المرتبطة بهذه الكورسات
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });
    const enrollmentIds = enrollments.map(e => e._id);

    // 4. جلب كل البيمنتات المرتبطة بهذه الانرولمنتات مع البوبليت
    const payments = await Payment.find({ enrollment: { $in: enrollmentIds } })
      .populate({
        path: "enrollment",
        populate: { path: "course", select: "title" }
      })
      .populate({
        path: "enrollment",
        populate: {
          path: "student",
          populate: { path: "user", select: "name email" }
        }
      });

    // 5. تجميع المدفوعات (paid + unpaid) مع تصفية حسب المعلم
    const result = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id,
          paymentStatus: { $in: ['paid', 'unpaid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPayment: { $sum: "$amount" }
        }
      }
    ]);

    // 6. تجميع المدفوعات غير المدفوعة (unpaid) فقط
    const result2 = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id,
          paymentStatus: 'unpaid'
        }
      },
      {
        $group: {
          _id: null,
          totalPayment: { $sum: "$amount" }
        }
      }
    ]);

    // 7. تجميع المدفوعات المدفوعة (paid) فقط
    const result3 = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id,
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalPayment: { $sum: "$amount" }
        }
      }
    ]);

    // 8. تجميع المدفوعات حسب الكورس مع عدّ الطلاب
    const paymentByCourse = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id
        }
      },
      {
        $group: {
          _id: "$course._id",
          courseTitle: { $first: "$course.title" },
          totalPayment: { $sum: "$amount" },
          pendingPayment: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, "$amount", 0]
            }
          },
          successfulPayment: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0]
            }
          },
          studentCount: { $addToSet: "$enrollment.student" }
        }
      },
      {
        $project: {
          courseTitle: 1,
          totalPayment: 1,
          pendingPayment: 1,
          successfulPayment: 1,
          studentCount: { $size: "$studentCount" }
        }
      }
    ]);

    // 9. استخراج القيم أو تعيين صفر إذا لم توجد بيانات
    const totalPayment = result[0]?.totalPayment || 0;
    const pendingPayment = result2[0]?.totalPayment || 0;
    const successfullyPayment = result3[0]?.totalPayment || 0;

    // 10. فلترة المدفوعات حسب استعلام البحث
    const filteredPayments = payments.filter(payment => {
      const transactionMatch = payment.transactionId?.toLowerCase().includes(searchQuery);
      const studentNameMatch = payment.enrollment.student.user.name.toLowerCase().includes(searchQuery);
      const courseTitleMatch = payment.enrollment.course.title.toLowerCase().includes(searchQuery);
      const amountMatch = payment.amount.toString().includes(searchQuery);
      const methodMatch = payment.paymentMethod?.toLowerCase().includes(searchQuery);
      const statusMatch = payment.paymentStatus.toLowerCase().includes(searchQuery);
      const dateMatch = moment(payment.createdAt).format("YYYY-MM-DD").includes(searchQuery);

      return (
        transactionMatch ||
        studentNameMatch ||
        courseTitleMatch ||
        amountMatch ||
        methodMatch ||
        statusMatch ||
        dateMatch
      );
    });

    // 11. تصنيف المدفوعات حسب الحالة
    const unpaidPayments = filteredPayments.filter(payment => payment.paymentStatus === 'unpaid');
    const paidPayments = filteredPayments.filter(payment => payment.paymentStatus === 'paid');

    // 12. إعادة العرض
    res.render("pages/teacher/payments/paymentReporte", {
      payments: filteredPayments,
      paymentByCourse,
      unpaidPayments,
      paidPayments,
      totalPayment,
      pendingPayment,
      successfullyPayment,
      moment
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};


teacher_payment_view_get = async (req, res) => {
  try{
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: "enrollment",
        populate: { path: "course", select: "title" }
      })
      .populate({
        path: "enrollment",
        populate: {
          path: "student",
          populate: { path: "user", select: "name email" }
        }
      });
    res.render("pages/teacher/payments/paymentView", { payment, moment: moment });

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}
teacher_payment_view_course_get = async (req, res) => {
  try{
        const query = req.query;// serch

    const course = await Course.findById(req.params.id)
  
      const enrollments = await Enrollment.find({ course: course._id })
     
  const payments = await Payment.find({
  enrollment: { $in: enrollments.map(e => e._id) }
}).populate({
  path: "enrollment",
  populate: [
    { path: "course", select: "title" },
    { path: "student", populate: { path: "user", select: "name email" } }
  ]
});
   // فلترة البحث حسب الاسم والحالة
  const filteredPayments = payments.filter(payment => {
  const nameMatch = req.query.studentName
    ? payment.enrollment.student.user.name
        .toLowerCase()
        .includes(req.query.studentName.toLowerCase())
    : true;

  const statusMatch = req.query.paymentStatus
    ? payment.paymentStatus === req.query.paymentStatus
    : true;

  return nameMatch && statusMatch;
});
    res.render("pages/teacher/payments/paymentViewCourse", {course, filteredPayments, moment: moment });

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}
teacher_payments_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const enrollments = await Enrollment.find({ course: { $in: teacher.courses } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) } })
      .populate({
    path: "enrollment",
    populate: { path: "course", select: "title" }
  })
  .populate({
    path: "enrollment",
    populate: {
      path: "student",
      populate: { path: "user", select: "name email" }
    }
  });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: payment.enrollment.course.title,
        amount: payment.amount,
        status: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('Payments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }


}
teacher_payments_by_course_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const course = await Course.find({teacher: teacher._id});
    const enrollments = await Enrollment.find({ course: { $in: course } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) } })
      .populate({
        path: "enrollment",
        populate: {
          path: "course",
          select: "title"
        }
      })
      .populate({
        path: "enrollment",
        populate: {
          path: "student",
          populate: {
            path: "user",
            select: "name email"
          }
        }
      });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return{
        courseTitle: payment.enrollment.course.title,
        numberOfStudents: payment.enrollment.length,
        totalPayment: payment.amount,
        pendingPayment: payment.paymentStatus === "unpaid" ? payment.amount : 0,
        successfulPayment: payment.paymentStatus === "paid" ? payment.amount : 0,
      }
    }
    );
    // تحويل البيانات إلى CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);
    res.header('Content-Type', 'text/csv');
    res.attachment('PaymentsByCourse.csv');
    return res.send(csv);
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
}
}
teacher_pending_payments_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const enrollments = await Enrollment.find({ course: { $in: teacher.courses } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) }, paymentStatus: "unpaid" })
      .populate({
    path: "enrollment",
    populate: { path: "course", select: "title" }
  })
  .populate({
    path: "enrollment",
    populate: {
      path: "student",
      populate: { path: "user", select: "name email" }
    }
  });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: payment.enrollment.course.title,
        amount: payment.amount,
        status: payment.paymentStatus,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('pendingPayments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }

}
teacher_paid_payments_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const enrollments = await Enrollment.find({ course: { $in: teacher.courses } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) }, paymentStatus: "paid" })
      .populate({
    path: "enrollment",
    populate: { path: "course", select: "title" }
  })
  .populate({
    path: "enrollment",
    populate: {
      path: "student",
      populate: { path: "user", select: "name email" }
    }
  });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: payment.enrollment.course.title,
        amount: payment.amount,
        status: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('successfullyPayments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
  
}

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

teacher_profile_get = async (req, res) => {
  try{
    const user = await User.findById(req.user._id).select("name email profilePicture createdAt")
    const teacher = await Teachers.findOne({ user: req.user._id }).select("address phone")
    res.render("pages/teacher/profile/my-profile" , { user , teacher, moment})

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}
teacher_profile_edit_get = async (req, res) => {
  try{
    const user = await User.findById(req.user._id).select("name email profilePicture ")
    const teacher = await Teachers.findOne({ user: req.user._id }).select("address phone")
    res.render("pages/teacher/profile/edit-profile" , { user , teacher})

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}

teacher_profile_edit_put = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email profilePicture profilePicturePublicId password");
    const teacher = await Teachers.findOne({ user: req.user._id });
 
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    if (!teacher) {
      req.flash('error', 'Teacher profile not found');
      return res.redirect('/student/profile/edit');
    }

    const updatedUserData = {
      name: req.body.name ?? user.name,
      email: req.body.email ?? user.email,
      profilePicture: user.profilePicture, 
      profilePicturePublicId: user.profilePicturePublicId, // حافظ عليه أيضاً
    };

    if (req.file) {
      // حذف الصورة القديمة باستخدام public_id الصحيح
      if (user.profilePicturePublicId) {
        try {
          await cloudinary.uploader.destroy(user.profilePicturePublicId);
        } catch (err) {
          console.error("Error deleting old image from Cloudinary:", err);
        }
      }

      // رفع الصورة الجديدة
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "LMS/courses",
        use_filename: true,
        unique_filename: false,
      });

      updatedUserData.profilePicture = uploadResult.secure_url;
      updatedUserData.profilePicturePublicId = uploadResult.public_id;
    }

    if (req.body.password && req.body.password.trim() !== "") {
      const password = req.body.password.trim();

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
      if (!passwordRegex.test(password)) {
        req.flash(
          "error",
          "Password must be at least 8 characters with 1 upper case letter, 1 number, and 1 special character."
        );
        return res.redirect("/student/profile/edit");
      }

      updatedUserData.password = await bcrypt.hash(password, 10);
    } else {
      updatedUserData.password = user.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedUserData,
      { new: true }
    ).select("name email profilePicture");

    const updatedTeacher = await Teachers.findOneAndUpdate(
      { user: req.user._id },
      {
        phone: req.body.phone ?? teacher.phone,
        address: req.body.address ?? teacher.address,
      },
      { new: true }
    ).select("phone address");

    req.flash("success", "Profile updated successfully");
    res.redirect("/teacher/profile");

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

  

teacher_addTask_post = async (req, res) => {
    try{
      const { title, dueDate } = req.body;
      const task = await Task.create({
        title,
        dueDate,
        user: req.user._id,
      });
      req.flash("success", "Task added successfully");
      res.redirect("/dashboard");
  
  
    }
    catch(err){
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  
  teacher_deleteTask_delete = async (req, res) => {
    try {
      const taskId = req.params.id; // الحصول على الـ id من الرابط
      const task = await Task.findById(taskId); // جلب المهمة
      if (!task) {
        req.flash("error", "Task not found.");
        return res.redirect("/dashboard");
      }
  
      // حذف المهمة
      await Task.findByIdAndDelete(taskId);
      req.flash("success", "Task deleted successfully.");
      res.redirect("/dashboard");
    } catch (err) {
      console.error("Error deleting task:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  teacher_updateTaskStatus_put = async (req, res) => {
    try{
      const { id } = req.params;
    const { status } = req.body;
  
    if (!['done', 'expired'].includes(status)) {
      return req.flash("error", "Invalid status");
    }
     const updatedTask = await Task.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      if (!updatedTask) {
        return req.flash("error", "Task not found");
      }
  
      req.flash("success", "Task status updated successfully");
      res.redirect("/dashboard");
  
  
    }
    catch(err){
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
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
    teacher_payments_get,
    teacher_payment_view_get,
    teacher_payment_view_course_get,
    teacher_payments_export_get,
    teacher_payments_by_course_export_get,
    teacher_pending_payments_export_get,
    teacher_paid_payments_export_get,
    teacher_send_notification_get,
    teacher_send_notification_post,
    teacher_notifications_get,
    teacher_profile_get,
    teacher_profile_edit_get,
    teacher_profile_edit_put,
    teacher_addTask_post,
    teacher_deleteTask_delete,
    teacher_updateTaskStatus_put,
};