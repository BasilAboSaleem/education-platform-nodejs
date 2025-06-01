const {User, Admin, Teacher, Student,
  check, validationResult, bcrypt, jwt, nodemailer, crypto
} = require("./utils");


regester_get= (req,res) => {
    res.render("pages/auth/regester")
}
regester_post = async (req,res) => {
    try{
        const curruntEmail = await User.findOne({email: req.body.email})
        if(curruntEmail){
           return res.json({existEmail: "Email already exist, Try to login"})
        }
        const objErr = validationResult(req) 
        if(objErr.errors.length >0){
            return res.json({objErr: objErr.errors})
        }
        //المصادقة الثنائية
          // 1. توليد رمز تحقق
    const otp = crypto.randomInt(100000, 999999).toString(); // رمز من 6 أرقام
    const otpExpires = Date.now() + 15 * 60 * 1000; // ينتهي بعد 15 دقيقة
    //انشاء المستخدم وحفظ الرمز
        const newuser = await User.create({
            ...req.body,
            otp,
            otpExpires,
            isVerified: false,
            })
            // حفظ userId في السيشن ليتم استخدامه في صفحة التحقق
            req.session.userId = newuser._id;
        //بعد انشاء اليوزر في الداتا بيز بدي افحص نوع الرولز وانشئ حسب الرولز أوبجيكت من نوعه
       if(newuser.role === "Admin"){
        const newAdmin = await Admin.create({user: newuser._id})
       } else if(newuser.role === "Teacher") {
        const newTeacher = await Teacher.create({user: newuser._id })
       } else if(newuser.role === "Student") {
        const newStudent = await Student.create({user: newuser._id})
       }
          // 4. إرسال رمز التحقق للمصادقة الثنائية على الإيميل
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // من ملف env
        pass: process.env.EMAIL_PASS,
      },
    });
        const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newuser.email,
      subject: "Email Verification Code",
      html: `
        <p>Hello ${newuser.name},</p>
        <p>Here is your verification code:</p>
        <h2>${otp}</h2>
        <p>This code will expire in 15 minutes.</p>
      `,
    };
    await transporter.sendMail(mailOptions);

    return res.json({ success: true, redirectTo: "/verify" });

  } catch (err) {
    console.log(err);
  }
};

module.exports = {
    regester_get,
    regester_post
};