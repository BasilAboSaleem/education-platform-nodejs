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
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No session available' });
  }

  if (req.session.otpBlockedUntil && Date.now() < req.session.otpBlockedUntil) {
    return res.json({ success: false, blocked: true, message: 'Too many attempts. Please try again later.' });
  }

  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.body.otp === user.otp && Date.now() < user.otpExpires) {
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

        // تحديث حالة المعلم او الطالب المرتبط عند تحقق البريد
  if(user.role === "Teacher") {
    await Teacher.findOneAndUpdate(
      { user: user._id },
      { status: 'Pending' }
    );
  } else if(user.role === "Student") {
    await Student.findOneAndUpdate(
      { user: user._id },
      { status: 'Active' }
    );
  }

      req.session.userId = null;
      req.session.otpAttempts = 0;
      req.session.otpBlockedUntil = null;

      return res.json({ success: true, redirectTo: "/login" });
    } else {
      req.session.otpAttempts = (req.session.otpAttempts || 0) + 1;

      if (req.session.otpAttempts >= 5) {
        req.session.otpBlockedUntil = Date.now() + 15 * 60 * 1000;
      }

      return res.json({ success: false, invalidOtp: true, message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
resend_verify_post = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  // تحقق من وقت الإرسال السابق لتقييد التكرار
  if (req.session.lastOtpSent && Date.now() - req.session.lastOtpSent < 60 * 1000) {
    return res.json({ success: false, message: 'Please wait before requesting a new code.' });
  }

  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({ success: false, message: 'User is already verified.' });
    }

    // توليد رمز تحقق جديد
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    req.session.lastOtpSent = Date.now();

    // إرسال رمز التحقق الجديد عبر البريد الإلكتروني
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Email Verification Code",
      html: `
        <p>Hello ${user.name},</p>
        <p>Here is your new verification code:</p>
        <h2>${otp}</h2>
        <p>This code will expire in 15 minutes.</p>
      `,
    };
    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: 'Verification code resent successfully' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

login_get = (req, res) => {
    res.render("pages/auth/login")
}
login_post = async (req,res) => {
    try{
        const login = await User.findOne({email: req.body.email}) // تأكد من أن المستخدم تم التحقق منه
        if(!login){
            return res.json({notFoundEmail: "Not Found Email Plase Register"})
        }else{
            const isMatch = await bcrypt.compare(req.body.password , login.password)
            if(!isMatch){
                return res.json({errPassword: "Rong password"})
            }else{
                const token = jwt.sign({id: login._id}, process.env.JWTSECRET_KEY)
                res.cookie('jwt', token, {httpOnly:true, maxAge: 86400000})
              if (!login.isVerified) {
  req.session.userId = login._id;
  return res.json({ success: true, redirectTo: "/verify" });
}
                return res.json({ success: true, redirectTo: "/dashboard" }); // Redirect the user on success
               

            }
        }
       

    }
    catch(err){
        console.log(err);
    }
}
forgot_password_get = (req, res) => {
    res.render("pages/auth/forgot-password");
};
forgot_password_post = async (req, res)=> {
  try{
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash('error', 'No account found with that email address.');
      return res.redirect('/forgot-password');
    }
     //توليد توكن عشوائي
    const resetToken = crypto.randomBytes(32).toString('hex');
    //توليد تاريخ انتهاء صلاحية التوكن
    const resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 دقيقة
    // حفظ التوكن وتاريخ الانتهاء في قاعدة البيانات
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // بناء رابط إعادة التعيين
const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: '"Learnova Support" <support@learnova.com>',
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 15 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    req.flash('success', 'Password reset link has been sent to your email.');
    return res.redirect('/login'); 
  }
  catch(err){
    console.log(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
reset_password_get = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    req.flash('error', 'Invalid or missing token');
    return res.redirect('/forgot-password');   
  }
  try{
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // تحقق من أن التوكن لم ينتهِ بعد
    });
    if (!user) {
      req.flash('error', 'Invalid or expired token');
      return res.redirect('/forgot-password');
    }
    res.render('pages/auth/reset-password', { token });

  }
  catch(err){
    console.log(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }

}
reset_password_post = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // لو فيه خطأ في التحقق من كلمة المرور
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // تحقق من أن التوكن لم ينتهِ بعد
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined; // إزالة التوكن بعد إعادة التعيين
    user.resetPasswordExpires = undefined; // إزالة تاريخ الانتهاء بعد إعادة التعيين
    console.log(user.password);
 
    await user.save();



    return res.status(200).json({ success: true, message: 'Password reset successfully' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
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
  verify_post,
  resend_verify_post,
  forgot_password_get,
  forgot_password_post,
  reset_password_get,
  reset_password_post
}