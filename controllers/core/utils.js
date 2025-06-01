const User = require("../../models/user");
const Student = require("../../models/student");
const Teachers = require("../../models/teacher");
const Setting = require("../../models/setting");
const Course = require("../../models/course");
const Payment = require("../../models/payment");
const Enrollment = require("../../models/enrollment");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const moment = require('moment');
const user = require("../../models/user");
const Task = require("../../models/task");
const nodemailer = require('nodemailer');

module.exports = {
    User,
    Student,
    Teachers,
    Setting,
    Course,
    Payment,
    Enrollment,
    check,
    validationResult,
    bcrypt,
    jwt,
    moment,
    user,
    Task,
    nodemailer
};