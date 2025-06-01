const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');

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
        //حذف الانرولمنت من الانرولمنت سكيما
      const enrollments = await Enrollment.find({ student: req.params.id })
        await Enrollment.deleteMany({ student: req.params.id })
        //حذف البيمنت من البيمنت سكيما
        await Payment.deleteMany({ enrollment: { $in: enrollments.map(e => e._id) } });
        //حذف التاسك الخاصة بالطالب من التاسك سكيما
        await Task.deleteMany({ user: student.user._id });
        //حذف الاشعارات الخاصة بالطالب من الاشعارات سكيما
        await Notification.deleteMany({ recipient: student.user._id });

        req.flash("success", "Student deleted successfully");
        return res.redirect("/admin/students")

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

module.exports = {
    admin_students_get,
    admin_students_view_get,
    admin_students_edit_get,
    admin_students_edit_put,
    admin_students_delete,
    admin_students_status_put,
    admin_students_search_post
};