const User = require("../models/user");
const Admin = require("../models/admin");
const Teacher = require("../models/teacher");
const Student = require("../models/student");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');



regester_get= (req,res) => {
    res.render("pages/auth/regester")
}
regester_post = async (req,res) => {
    try{
        const curruntEmail = await User.findOne({email: req.body.email})
        if(curruntEmail){
            console.log("email exsist");
           return res.json({existEmail: "Email already exist, Try to login"})
        }
        const objErr = validationResult(req) 
        if(objErr.errors.length >0){
            console.log(objErr);
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
        console.log(newAdmin);
       } else if(newuser.role === "Teacher") {
        const newTeacher = await Teacher.create({user: newuser._id })
        console.log(newTeacher);
       } else if(newuser.role === "Student") {
        const newStudent = await Student.create({user: newuser._id})
        console.log(newStudent);
       }
        console.log(newuser);
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
verify_get = async (req, res) => {
  // تأكد أن المستخدم موجود في السيشن
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized: No session available');
  }

  try { 
    // جلب بيانات المستخدم من الداتا بيز حسب الـ ID المحفوظ في السيشن
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.isVerified) {
      return res.redirect('/login');
    }

    return res.render('pages/auth/verify', { email: user.email, message: null });

  } catch (error) {
    console.error(error);
    return res.status(500).send('Server error');
  }
};
verify_post = async (req, res) => {
  // تأكد أن المستخدم موجود في السيشن
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized: No session available');
  }

  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // تحقق من الرمز المرسل
    if (req.body.otp === user.otp && Date.now() < user.otpExpires) {
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      req.session.userId = null; // مسح الـ ID من السيشن بعد التحقق
      return res.json({ success: true, redirectTo: "/login" });
    } else {
      return res.render('pages/auth/verify', { email: user.email, message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server error');
  }
}
login_get = (req, res) => {
    res.render("pages/auth/login")
}
login_post = async (req,res) => {
    try{
        const login = await User.findOne({email: req.body.email}) // تأكد من أن المستخدم تم التحقق منه
        if(!login){
            console.log("Not Found Email Plase Register");
            return res.json({notFoundEmail: "Not Found Email Plase Register"})
        }else{
            const isMatch = await bcrypt.compare(req.body.password , login.password)
            if(!isMatch){
                console.log("Rong password");
                return res.json({errPassword: "Rong password"})
            }else{
                const token = jwt.sign({id: login._id}, process.env.JWTSECRET_KEY)
                res.cookie('jwt', token, {httpOnly:true, maxAge: 86400000})
                console.log("don token");
                if(!login.isVerified){
                    console.log("not verified");
                    return res.json({notVerified: "Your account is not verified, please check your email for the verification code.", redirectTo: "/verify"});
                }
                return res.json({ success: true, redirectTo: "/dashboard" }); // Redirect the user on success
               

            }
        }
       

    }
    catch(err){
        console.log(err);
    }
}
logout_get = (req, res) => {
    
        res.clearCookie('connect.sid');
        res.clearCookie('jwt');
        // إعادة توجيه المستخدم بعد تسجيل الخروج
        res.redirect('/login'); // أو المسار الذي تريد توجيه المستخدم إليه
};
module.exports ={
  regester_get,
  regester_post,
  verify_get,
  login_post,
  login_get,
  logout_get,
  verify_post
}