const express = require("express");

const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const port = process.env.PORT || 3001;
const mongoose = require("mongoose");
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
var methodOverride = require('method-override')
app.use(methodOverride('_method'))

// إعداد الـ session

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,    // يجعل الكوكيز غير قابل للوصول من خلال الجافاسكربت
    secure: process.env.NODE_ENV === 'production',  // يكون الكوكيز آمنًا فقط في بيئة الإنتاج (إذا كان يعمل عبر HTTPS)
    sameSite: 'strict'  // يمنع الكوكيز من المشاركة بين النوافذ المختلفة
  }
})); 
// إعداد flash
app.use(flash());

const authRoute = require('./routes/authRoute');
const coreRoute = require('./routes/coreRoute');
const adminRoute = require('./routes/adminRouts');
const studentRoute = require('./routes/studentRoutes');
const teacherRoute = require('./routes/teacherRours');
const { checkIfUser, requireAuth, loadUserNotifications } = require('./middlewares/authMiddleware');

var cookieParser = require('cookie-parser')
app.use(cookieParser())
app.use(express.json())
require('dotenv').config()

// Auto refresh
const path = require("path");
const livereload = require("livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "public"));

const connectLivereload = require("connect-livereload");
app.use(connectLivereload());


liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

//الاتصال بقاعدة البيانات
mongoose
.connect(
  process.env.MONGODB_URL
)
  .then(() => {
    app.listen(port, () => {
      console.log(`http://localhost:${port}/`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
  app.use(checkIfUser);
  app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
  });
  // Middleware to set user in res.locals
  app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});
// Middleware to load user notifications
app.use(loadUserNotifications);
  app.use(coreRoute);
  app.use(authRoute);
  app.use(adminRoute);
 app.use(studentRoute);
  app.use(teacherRoute);
  

