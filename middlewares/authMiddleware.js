var jwt = require("jsonwebtoken");
const UserModel = require("../models/user")
const Notification = require("../models/notification")
const rateLimit = require("express-rate-limit");


//دالة لفحص تسجيل الدخول قبل السماج للمستخدم بالذهاب للراوت المطلوب
const requireAuth = (req,res,next) => {
    const token = req.cookies.jwt
    if(token){
        jwt.verify(token, process.env.JWTSECRET_KEY, (err) => {
            if(err){
                res.rediret("/login")
            }else{
                next()
            }
            
        })

}else{
    res.redirect("/login")
}

}
//دالة لفحص تسجيل المستخدم وارسال بياناته عير متغير الى الفرونت لاستخدامها
const checkIfUser =  (req, res, next) => {
 
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.JWTSECRET_KEY, async (err, decoded) => {
      if (err) {
        res.locals.user = null;
        req.user = null; 
        next();
      } else {
        const currentUser = await UserModel.findById(decoded.id);
        res.locals.user = currentUser;
        req.user = currentUser  
        next();
      }
    });
  } else {
    res.locals.user = null;
    req.user = null; 
    next();
  }
};
//دالة لجلب الاشعارات الخاصة بالمستخدم
const loadUserNotifications = async (req, res, next) => {
  if (req.user) {
    try {
      const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5); // آخر 5 إشعارات مثلاً

      res.locals.notifications = notifications;
      res.locals.notificationCount = notifications.length;
    } catch (err) {
      console.error('Error loading notifications:', err);
      res.locals.notifications = [];
      res.locals.notificationCount = 0;
    }
  } else {
    res.locals.notifications = [];
    res.locals.notificationCount = 0;
  }
  next();
};
//دوال لفحص صلاحيات المستخدم
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).send('Access denied.');
    }
}

const isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'Teacher') {
        next();
    } else {
        res.status(403).send('Access denied.');
    }
}

const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'Student') {
        next();
    } else {
        res.status(403).send('Access denied.');
    }
}

// استيراد مكتبة rate-limit الخاصة بتقييد محاولات تسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 دقائق
  max: 5, // يسمح بـ 5 محاولات فقط خلال 10 دقائق من نفس الـ IP
  message: {
    error: "Too many login attempts. Please try again after 10 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
    requireAuth,
    checkIfUser,
    loadUserNotifications,
    isAdmin,
    isTeacher,
    isStudent,
    loginLimiter
}