const { User, Student, Teachers, Setting, Course, Payment, Enrollment, 
check, validationResult, bcrypt, jwt, moment, user, Task, nodemailer
} = require('./utils');

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
module.exports = {
    index_get,
    contact_post
};

