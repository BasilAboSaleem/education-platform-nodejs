const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");
const Setting = require("../models/setting");
const Course = require("../models/course");
const Payment = require("../models/payment");
const Enrollment = require("../models/enrollment");

const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const moment = require('moment');
const user = require("../models/user");
const Task = require("../models/task");
const nodemailer = require('nodemailer');


index_get = async (req,res) => {
    try{
    const settings = await Setting.findOne();
    const courses = await Course.find({ status: "Published" }).limit(6).populate("category").populate({
        path: "teacher",
        populate: {
            path: "user",
            select: "name image"
        }
    });
    const teachers = await Teachers.find({ status: "Active" }).populate("user", "name image").limit(4);

        res.render("index", { settings,courses,moment, teachers });

    }
    catch(err){
        console.log(err);
    }
    
}
contact_post = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            req.flash('error', 'All fields are required.');
            return res.redirect('back');
        }

         // إعداد الترانسبورتر (SMTP transport)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // أو استخدم "host" و "port" لو تستخدم SMTP مختلف
      auth: {
        user: process.env.EMAIL_USER, // بريدك الإلكتروني
        pass: process.env.EMAIL_PASS // كلمة المرور أو App Password
      }
    });

    // إعداد الرسالة
    const mailOptions = {
      from: email, // بريد المرسل (الزائر)
      to: process.env.EMAIL_USER, // بريد المستلم (إيميل الموقع)
      subject: `New message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    };

    // إرسال الإيميل
    await transporter.sendMail(mailOptions);


        req.flash('success', 'Your message has been sent successfully!');
        return res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong. Please try again later.');
        return res.redirect('back');
    }
}

dashboard_get = async (req,res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    const settings = await Setting.findOne();
    const tasks = await Task.find({ user: req.user._id });

    if (req.user.role === "Admin") {
        const userUnverified = await User.find({ isVerified: false });
        const payments = await Payment.find({ paymentStatus: "paid" });
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
const monthlyRevenue = {};

// أنشئ مصفوفة آخر 6 أشهر
for (let i = 5; i >= 0; i--) {
    const month = moment().subtract(i, 'months').format('MMMM'); // مثل: "May"
    monthlyRevenue[month] = 0;
}

// احسب مجموع الإيرادات لكل شهر
payments.forEach(payment => {
    const month = moment(payment.createdAt).format('MMMM');
    if (monthlyRevenue[month] !== undefined) {
        monthlyRevenue[month] += payment.amount;
    }
});

const chartLabels = Object.keys(monthlyRevenue); // [ "January", ..., "May" ]
const chartData = Object.values(monthlyRevenue); // [ 1200, 1500, 800, ... ]

        return res.render("dashboard", { tasks , moment, logo: settings.siteLogo, userUnverified, totalRevenue, chartLabels, chartData });

    }else if (req.user.role === "Student") {
        return res.render("dashboard", { tasks , moment, logo: settings.siteLogo });

    } else if (req.user.role === "Teacher") {
        const teacher = await Teachers.findOne({ user: req.user._id });
        const courses = await Course.find({ teacher: teacher._id });
        const enrollments = await Enrollment.find({ course: { $in: courses.map(course => course._id) } });
        const payments = await Payment.find({ enrollment: { $in: enrollments.map(enrollment => enrollment._id) }, paymentStatus: "paid" });
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);


        return res.render("dashboard", { tasks , moment, logo: settings.siteLogo, totalRevenue });
    }

};

module.exports= {
    index_get ,
    dashboard_get,
    contact_post
   
   }