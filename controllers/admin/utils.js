const User = require("../../models/user");
const Student = require("../../models/student");
const Teachers = require("../../models/teacher");
const Category = require("../../models/Category");
const Course = require("../../models/course");
const Lesson = require("../../models/lesson");
const Payment = require("../../models/payment");
const Enrollment = require("../../models/enrollment");
const Notification = require("../../models/notification");
const Setting = require("../../models/setting");
const Task = require("../../models/task");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const moment = require('moment');
const multer  = require('multer')
const upload = multer({storage: multer.diskStorage({})});
const cloudinary = require("cloudinary").v2;
require('dotenv').config();
const fs = require('fs');
const { model } = require("mongoose");
const path = require("path");
const { Parser } = require('json2csv');
const { send, title } = require("process");
const { v4: uuidv4 } = require('uuid');

 // Configuration cloudinary اعدادات الكلاودنري
 cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET 
});

module.exports = {
  User,
  Student,
  Teachers,
  Category,
  Course,
  Lesson,
  Payment,
  Enrollment,
  Notification,
  Setting,
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
  model,
  path,
  Parser,
  send,
  title,
  uuidv4,
};
