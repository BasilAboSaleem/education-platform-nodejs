const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');


  admin_payments_get = async (req,res) => {
    try{
      const payments = await Payment.find().populate({
         path: 'enrollment',
  populate: [
    {
      path: 'student',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name email',
      }
    },
    {
      path: 'course',
      model: 'Course'
    }
  ]
});
      // إضافة تجميع المدفوعات التي تمت 
      const result = await Payment.aggregate([
        {
         $match: { paymentStatus: { $in: ['paid', 'unpaid'] } }// فقط المدفوعات المكتملة
        },
        {
          $group: {
            _id: null,
            totalPayment: { $sum: "$amount" }
          }
        }
      ]);
      //اضافة مجموع المدفوعات المتوقعة البنديح
      const result2 = await Payment.aggregate([
        {
          $match: { paymentStatus: 'unpaid' } // فقط المدفوعات المكتملة
        },
        {
          $group: {
            _id: null,
            totalPayment: { $sum: "$amount" }
          }
        }
      ]);
      // $match: { paymentStatus: 'paid' }  فقط المدفوع
      const result3 = await Payment.aggregate([
        {
          $match: { paymentStatus: 'paid' } // فقط المدفوعات المكتملة
        },
        {
          $group: {
            _id: null,
            totalPayment: { $sum: "$amount" }
          }
        }
      ]);
      // تجميع المدفوعات حسب اسم الكورس
const paymentByCourse = await Payment.aggregate([
  {
    // نربط بين Collection المدفوعات (Payment) والانرولمنتس (Enrollments)
    $lookup: {
      from: 'enrollments',               // الكولكشن الثاني اللي بدنا نربط معه
      localField: 'enrollment',          // الحقل في وثيقة Payment اللي يحتوي ObjectId لـ enrollment
      foreignField: '_id',               // الحقل في وثيقة Enrollment اللي راح نطابق عليه
      as: 'enrollment'                   // اسم الحقل الجديد اللي راح يحتوي بيانات الانرولمنت المطابقة
    }
  },
  {
    // لأن $lookup بيرجع مصفوفة، نستخدم $unwind لتحويلها إلى كائن واحد بدل مصفوفة
    $unwind: "$enrollment"
  },
  {
    // نربط الآن بين enrollment الموجود داخل كل payment وبين جدول الكورسات
    $lookup: {
      from: 'courses',                   // الكولكشن الثاني (Courses)
      localField: 'enrollment.course',   // الحقل داخل enrollment اللي فيه ObjectId الكورس
      foreignField: '_id',               // الحقل في Course اللي راح نطابق عليه
      as: 'course'                       // اسم الحقل الجديد اللي راح يحتوي الكورس المرتبط
    }
  },
  {
    // نفس الشي، نحول مصفوفة الكورسات إلى كائن واحد
    $unwind: "$course"
  },
  {
    // الآن نبدأ بتجميع النتائج لكل كورس
    $group: {
      _id: "$course._id",                      // كل كورس يكون مجموعة مستقلة حسب ID تبعه
      courseTitle: { $first: "$course.title" },// نأخذ عنوان الكورس من أول وثيقة (كلها نفس العنوان)
      totalPayment: { $sum: "$amount" },       // مجموع كل المبالغ المدفوعة أو غير المدفوعة لهذا الكورس
      pendingPayment: {
        $sum: {
          $cond: [                              // إذا الحالة unpaid، أضف المبلغ، غير هيك أضف 0
            { $eq: ["$paymentStatus", "unpaid"] },
            "$amount",
            0
          ]
        }
      },
      successfulPayment: {
        $sum: {
          $cond: [                              // إذا الحالة paid، أضف المبلغ، غير هيك أضف 0
            { $eq: ["$paymentStatus", "paid"] },
            "$amount",
            0
          ]
        }
      },
      studentCount: { $addToSet: "$enrollment.student" } // نخزن معرفات الطلاب المرتبطين بهذا الكورس (بدون تكرار)
    }
  },
  {
    // عرض النتيجة النهائية، وعدد الطلاب نحسبه من حجم المصفوفة
    $project: {
      courseTitle: 1,
      totalPayment: 1,
      pendingPayment: 1,
      successfulPayment: 1,
      studentCount: { $size: "$studentCount" }  // حساب عدد الطلاب الفعليين المسجلين
    }
  }
]);

      const totalPayment = result[0]?.totalPayment || 0;
      const pendingPayment = result2[0]?.totalPayment || 0;
      const successfullyPayment = result3[0]?.totalPayment || 0;

const unpaidPayments = payments.filter(payment => payment.paymentStatus === 'unpaid');
const paidPayments = payments.filter(payment => payment.paymentStatus === 'paid');

res.render("pages/admin/payments/paymentReporte",
   { payments, totalPayment, pendingPayment, successfullyPayment, paymentByCourse, unpaidPayments, paidPayments, moment });

    }
    catch(err){
      console.log(err);
    }
  }

  admin_payments_view_get = async (req,res) => {
    try{
      const payment = await Payment.findById(req.params.id).populate({
        path: 'enrollment',
        populate:{
          path: 'student',
          populate: {
            path: 'user',
            select: 'name email'
          }
        }
      }).populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          populate: {
            path: 'teacher',
            populate: {
              path: 'user',
              select: 'name email'
            }
          }
        }
      });

      res.render("pages/admin/payments/paymentView", { payment, moment });

    }
    catch(err){
      console.log(err);
    }

  }

  admin_payments_export_get = async (req,res) => {
    try{
      const payments = await Payment.find().populate({
        path: 'enrollment',
        populate: [
          {
            path: 'student',
            populate: {
              path: 'user',
              select: 'name email'
            }
          },
          {
            path: 'course',
            model: 'Course'
          }
        ]
      });

      // تهيئة البيانات بطريقة بسيطة
    const csvData = payments.map(payment => ({
      studentName: payment.enrollment.student.user.name,
      studentEmail: payment.enrollment.student.user.email,
      courseTitle: payment.enrollment.course.title,
      amount: payment.amount,
      status: payment.paymentStatus,
      method: payment.paymentMethod,
      date: payment.createdAt.toLocaleDateString(),
    }));

    // توليد CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    // إعداد الرد ليكون ملف قابل للتحميل
    res.header('Content-Type', 'text/csv');
    res.attachment('payments.csv');
    return res.send(csv);


    }
    catch(err){
      console.log(err);
    }

  }

  admin_payments_view_course_get = async (req,res) => {
    try{
      const courseId = req.params.id;
      const payment = await Payment.find().populate({
  path: 'enrollment',
  populate: {
    path: 'student',
    populate: {
      path: 'user',
      select: 'name email',
      model: 'User',
    }
  }
})
      .populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          model: 'Course',
          match: { _id: courseId },

        }
      });
      // فلترة المدفوعات التي تتعلق بالكورس المحدد
      const filteredPayments = payment.filter(p => p.enrollment.course && p.enrollment.course._id.toString() === courseId);
      // إذا لم يكن هناك مدفوعات، يمكن عرض رسالة أو شيء آخر
      if (filteredPayments.length === 0) {
        req.flash('error', 'No payments found for this course'); // تخزين رسالة الخطأ في الجلسة
        return res.redirect("/admin/payments");
      }

      res.render("pages/admin/payments/paymentViewCourse", {filteredPayments, moment });

    }
    catch(err){
      console.log(err);
    }
  }
  
admin_payments_paymentsByCourse_export_get = async (req, res) => {
  try {
    // 1. جميع المدفوعات مع التفاصيل
    const payments = await Payment.find().populate({
      path: 'enrollment',
      populate: [
        {
          path: 'student',
          populate: {
            path: 'user',
            select: 'name email'
          }
        },
        {
          path: 'course',
          model: 'Course'
        }
      ]
    });

    // 2. نحسب عدد الطلاب لكل كورس (بدون تكرار)
    const enrollments = await Enrollment.find();
    const studentCountMap = {};

    enrollments.forEach(enroll => {
      const courseId = enroll.course.toString();
      const studentId = enroll.student.toString();

      if (!studentCountMap[courseId]) {
        studentCountMap[courseId] = new Set();
      }
      studentCountMap[courseId].add(studentId);
    });

    // 3. تجهيز البيانات لـ CSV
    const csvData = payments.map(payment => {
      const course = payment.enrollment?.course;
      const courseId = course?._id?.toString();
      const numberOfStudents = studentCountMap[courseId]?.size || 0;

      return {
        courseTitle: course?.title || 'Unknown',
        numberOfStudents,
        totalAmount: payment.amount,
        successfulPayments: payment.paymentStatus === 'paid' ? payment.amount : 0,
        pendingPayments: payment.paymentStatus === 'unpaid' ? payment.amount : 0,
      };
    });

    // 4. توليد CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    // 5. إرسال الملف كـ CSV
    res.header('Content-Type', 'text/csv');
    res.attachment('paymentsByCourse.csv');
    return res.send(csv);

  } catch (err) {
    console.error('Export CSV Error:', err);
    res.status(500).send('Error generating CSV');
  }
};

admin_payments_pendingPayments_export_get = async (req, res) => {
  try{
    // 1. جميع المدفوعات مع التفاصيل
 const payments = await Payment.find({ paymentStatus: 'unpaid' }).populate({
  path: 'enrollment',
  populate: [
    {
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email',
        model: 'User'
      }
    },
    {
      path: 'course',
      model: 'Course'
    }
  ]
});

    // 2. تجهيز البيانات لـ CSV
    const csvData = payments.map(payment => {
      const course = payment.enrollment?.course;
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: course?.title || 'Unknown',
        amount: payment.amount,
        status: payment.paymentStatus,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    // 3. توليد CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

      // 5. إرسال الملف كـ CSV
    res.header('Content-Type', 'text/csv');
    res.attachment('pendingPayments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send('Error generating CSV');
  }
}

admin_payments_successfulPayments_export_get = async (req, res) => {
  try{
    const payments = await Payment.find({ paymentStatus: 'paid' }).populate({
  path: 'enrollment',
  populate: [
    {
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email',
        model: 'User'
      }
    },
    {
      path: 'course',
      model: 'Course'
    }
  ]
});
    const csvData = payments.map(payment => {
      const course = payment.enrollment?.course;
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: course?.title || 'Unknown',
        amount: payment.amount,
        status: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('successfulPayments.csv');
    return res.send(csv);

  }
  catch(err){
    console.log(err);
    res.status(500).send('Error generating CSV');
  }
}

module.exports = {
  admin_payments_get,
  admin_payments_view_get,
  admin_payments_export_get,
  admin_payments_view_course_get,
  admin_payments_paymentsByCourse_export_get,
  admin_payments_pendingPayments_export_get,
  admin_payments_successfulPayments_export_get
};