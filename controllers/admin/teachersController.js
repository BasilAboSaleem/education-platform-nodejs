const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');

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
      const teacher = await Teacher.findById(req.params.id).populate('user');

const courses = await Course.find({ teacher: req.params.id });
const courseIds = courses.map(course => course._id);

// 1. حذف الدروس
await Lesson.deleteMany({ course: { $in: courseIds } });

// 2. حذف الكورسات
await Course.deleteMany({ teacher: req.params.id });

// 3. حذف المهام
await Task.deleteMany({ user: teacher.user._id });

// 4. حذف الإشعارات
await Notification.deleteMany({ recipient: teacher.user._id });

// 5. حذف حساب اليوزر
await User.findByIdAndDelete(teacher.user._id);

// 6. حذف المعلم نفسه
await Teacher.findByIdAndDelete(req.params.id);

      req.flash('success', 'Teacher deleted successfully'); 
      return res.redirect("/admin/teachers")

    

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
        res.render("pages/admin/teachers/add-teacher", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت
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
module.exports = {
  admin_teachers_get,
  admin_teachers_view_get,
  admin_teachers_edit_get,
  admin_teachers_edit_put,
  admin_teachers_delete,
  admin_teachers_status_put,
  admin_teachers_search_post,
  admin_add_teacher_get,
  admin_add_teacher_post,
  admin_teachers_search_get
};