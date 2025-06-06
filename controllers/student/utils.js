const User = require("../../models/user");
const Student = require("../../models/student");
const Teachers = require("../../models/teacher");
const Course = require("../../models/course");
const Lesson = require("../../models/lesson");
const Category = require("../../models/category");
const Enrollment = require("../../models/enrollment");
const Payment = require("../../models/payment");
const Notification = require("../../models/notification");
const Task = require("../../models/task");

const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const moment = require("moment");
const multer = require("multer");
const upload = multer({ storage: multer.diskStorage({}) });
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const fs = require("fs");
const { render } = require("ejs");

// إعدادات Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ✅ التصدير
module.exports = {
  User,
  Student,
  Teachers,
  Course,
  Lesson,
  Category,
  Enrollment,
  Payment,
  Notification,
  Task,
  check,
  validationResult,
  bcrypt,
  jwt,
  moment,
  multer,
  upload,
  cloudinary,
  fs,
  render
};
