const {User, Admin, Teacher, Student,
  check, validationResult, bcrypt, jwt, nodemailer, crypto
} = require("./utils");

logout_get = (req, res) => {
    
        res.clearCookie('connect.sid');
        res.clearCookie('jwt');
        // إعادة توجيه المستخدم بعد تسجيل الخروج
        res.redirect('/login'); // أو المسار الذي تريد توجيه المستخدم إليه
};

module.exports = {
    logout_get
};