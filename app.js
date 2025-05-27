const express = require("express");
require('dotenv').config();

const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
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
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 // يوم واحد
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
// Middleware to load logo from settings
app.use(async (req, res, next) => {
  try {
    const settings = await Setting.findOne({});
    res.locals.logo = settings?.logo || 'default-logo.png';
  } catch (err) {
    res.locals.logo = 'default-logo.png';
  }
  next();
});
// Middleware to load user notifications
app.use(loadUserNotifications);
  app.use(coreRoute);
  app.use(authRoute);
  app.use(adminRoute);
 app.use(studentRoute);
  app.use(teacherRoute);
  

