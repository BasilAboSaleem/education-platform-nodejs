const {User, Admin, Teacher, Student,
  check, validationResult, bcrypt, jwt, nodemailer, crypto
} = require("./utils");


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

module.exports = {
  verify_get,
  verify_post,
  resend_verify_post
};