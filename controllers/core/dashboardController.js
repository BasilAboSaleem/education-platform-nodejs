const { User, Student, Teachers, Setting, Course, Payment, Enrollment, 
check, validationResult, bcrypt, jwt, moment, user, Task, nodemailer
} = require('./utils');


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

module.exports = {
    dashboard_get
};