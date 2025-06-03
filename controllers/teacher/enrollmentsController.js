const { User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, upload, cloudinary, fs, teacher,
  path, enrollment, Parser, send
} = require('./utils');

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


      res.render("pages/teacher/enrollments/studentEnrollments", { studentEnrollments, moment: moment });
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

        res.render("pages/teacher/enrollments/enrollmentDetails", { enrollment, payment , moment: moment });
    }
    catch(err){
        console.log(err);
    }
  } 

  module.exports = {
    teacher_student_enrollments_get,
    teacher_student_enrollment_view_get 
  };