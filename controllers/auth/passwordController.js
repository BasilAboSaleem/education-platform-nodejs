const {User, Admin, Teacher, Student,
  check, validationResult, bcrypt, jwt, nodemailer, crypto
} = require("./utils");


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


module.exports = {
  forgot_password_get,
  forgot_password_post,
  reset_password_get,
  reset_password_post
};