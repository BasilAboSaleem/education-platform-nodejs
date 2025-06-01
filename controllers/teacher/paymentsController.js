const { User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, upload, cloudinary, fs, teacher,
  path, enrollment, Parser, send
} = require('./utils');


teacher_payments_get = async (req, res) => {
  try {
    const searchQuery = req.query.query?.toLowerCase() || "";

    // 1. الحصول على المعلم الحالي
    const teacher = await Teachers.findOne({ user: req.user._id });

    // 2. الحصول على الكورسات التي يملكها هذا المعلم
    const courses = await Course.find({ teacher: teacher._id });
    const courseIds = courses.map(course => course._id);

    // 3. الحصول على الانرولمنتات المرتبطة بهذه الكورسات
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });
    const enrollmentIds = enrollments.map(e => e._id);

    // 4. جلب كل البيمنتات المرتبطة بهذه الانرولمنتات مع البوبليت
    const payments = await Payment.find({ enrollment: { $in: enrollmentIds } })
      .populate({
        path: "enrollment",
        populate: { path: "course", select: "title" }
      })
      .populate({
        path: "enrollment",
        populate: {
          path: "student",
          populate: { path: "user", select: "name email" }
        }
      });

    // 5. تجميع المدفوعات (paid + unpaid) مع تصفية حسب المعلم
    const result = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id,
          paymentStatus: { $in: ['paid', 'unpaid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPayment: { $sum: "$amount" }
        }
      }
    ]);

    // 6. تجميع المدفوعات غير المدفوعة (unpaid) فقط
    const result2 = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id,
          paymentStatus: 'unpaid'
        }
      },
      {
        $group: {
          _id: null,
          totalPayment: { $sum: "$amount" }
        }
      }
    ]);

    // 7. تجميع المدفوعات المدفوعة (paid) فقط
    const result3 = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id,
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalPayment: { $sum: "$amount" }
        }
      }
    ]);

    // 8. تجميع المدفوعات حسب الكورس مع عدّ الطلاب
    const paymentByCourse = await Payment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: "$enrollment" },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollment.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.teacher": teacher._id
        }
      },
      {
        $group: {
          _id: "$course._id",
          courseTitle: { $first: "$course.title" },
          totalPayment: { $sum: "$amount" },
          pendingPayment: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, "$amount", 0]
            }
          },
          successfulPayment: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0]
            }
          },
          studentCount: { $addToSet: "$enrollment.student" }
        }
      },
      {
        $project: {
          courseTitle: 1,
          totalPayment: 1,
          pendingPayment: 1,
          successfulPayment: 1,
          studentCount: { $size: "$studentCount" }
        }
      }
    ]);

    // 9. استخراج القيم أو تعيين صفر إذا لم توجد بيانات
    const totalPayment = result[0]?.totalPayment || 0;
    const pendingPayment = result2[0]?.totalPayment || 0;
    const successfullyPayment = result3[0]?.totalPayment || 0;

    // 10. فلترة المدفوعات حسب استعلام البحث
    const filteredPayments = payments.filter(payment => {
      const transactionMatch = payment.transactionId?.toLowerCase().includes(searchQuery);
      const studentNameMatch = payment.enrollment.student.user.name.toLowerCase().includes(searchQuery);
      const courseTitleMatch = payment.enrollment.course.title.toLowerCase().includes(searchQuery);
      const amountMatch = payment.amount.toString().includes(searchQuery);
      const methodMatch = payment.paymentMethod?.toLowerCase().includes(searchQuery);
      const statusMatch = payment.paymentStatus.toLowerCase().includes(searchQuery);
      const dateMatch = moment(payment.createdAt).format("YYYY-MM-DD").includes(searchQuery);

      return (
        transactionMatch ||
        studentNameMatch ||
        courseTitleMatch ||
        amountMatch ||
        methodMatch ||
        statusMatch ||
        dateMatch
      );
    });

    // 11. تصنيف المدفوعات حسب الحالة
    const unpaidPayments = filteredPayments.filter(payment => payment.paymentStatus === 'unpaid');
    const paidPayments = filteredPayments.filter(payment => payment.paymentStatus === 'paid');

    // 12. إعادة العرض
    res.render("pages/teacher/payments/paymentReporte", {
      payments: filteredPayments,
      paymentByCourse,
      unpaidPayments,
      paidPayments,
      totalPayment,
      pendingPayment,
      successfullyPayment,
      moment
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};


teacher_payment_view_get = async (req, res) => {
  try{
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: "enrollment",
        populate: { path: "course", select: "title" }
      })
      .populate({
        path: "enrollment",
        populate: {
          path: "student",
          populate: { path: "user", select: "name email" }
        }
      });
    res.render("pages/teacher/payments/paymentView", { payment, moment: moment });

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}
teacher_payment_view_course_get = async (req, res) => {
  try{
        const query = req.query;// serch

    const course = await Course.findById(req.params.id)
  
      const enrollments = await Enrollment.find({ course: course._id })
     
  const payments = await Payment.find({
  enrollment: { $in: enrollments.map(e => e._id) }
}).populate({
  path: "enrollment",
  populate: [
    { path: "course", select: "title" },
    { path: "student", populate: { path: "user", select: "name email" } }
  ]
});
   // فلترة البحث حسب الاسم والحالة
  const filteredPayments = payments.filter(payment => {
  const nameMatch = req.query.studentName
    ? payment.enrollment.student.user.name
        .toLowerCase()
        .includes(req.query.studentName.toLowerCase())
    : true;

  const statusMatch = req.query.paymentStatus
    ? payment.paymentStatus === req.query.paymentStatus
    : true;

  return nameMatch && statusMatch;
});
    res.render("pages/teacher/payments/paymentViewCourse", {course, filteredPayments, moment: moment });

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}
teacher_payments_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const enrollments = await Enrollment.find({ course: { $in: teacher.courses } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) } })
      .populate({
    path: "enrollment",
    populate: { path: "course", select: "title" }
  })
  .populate({
    path: "enrollment",
    populate: {
      path: "student",
      populate: { path: "user", select: "name email" }
    }
  });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: payment.enrollment.course.title,
        amount: payment.amount,
        status: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('Payments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }


}
teacher_payments_by_course_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const course = await Course.find({teacher: teacher._id});
    const enrollments = await Enrollment.find({ course: { $in: course } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) } })
      .populate({
        path: "enrollment",
        populate: {
          path: "course",
          select: "title"
        }
      })
      .populate({
        path: "enrollment",
        populate: {
          path: "student",
          populate: {
            path: "user",
            select: "name email"
          }
        }
      });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return{
        courseTitle: payment.enrollment.course.title,
        numberOfStudents: payment.enrollment.length,
        totalPayment: payment.amount,
        pendingPayment: payment.paymentStatus === "unpaid" ? payment.amount : 0,
        successfulPayment: payment.paymentStatus === "paid" ? payment.amount : 0,
      }
    }
    );
    // تحويل البيانات إلى CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);
    res.header('Content-Type', 'text/csv');
    res.attachment('PaymentsByCourse.csv');
    return res.send(csv);
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
}
}
teacher_pending_payments_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const enrollments = await Enrollment.find({ course: { $in: teacher.courses } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) }, paymentStatus: "unpaid" })
      .populate({
    path: "enrollment",
    populate: { path: "course", select: "title" }
  })
  .populate({
    path: "enrollment",
    populate: {
      path: "student",
      populate: { path: "user", select: "name email" }
    }
  });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: payment.enrollment.course.title,
        amount: payment.amount,
        status: payment.paymentStatus,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('pendingPayments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }

}
teacher_paid_payments_export_get = async (req, res) => {
  try{
    const teacher = await Teachers.findOne({user: req.user._id});
    const enrollments = await Enrollment.find({ course: { $in: teacher.courses } })
    const payments = await Payment.find({ enrollment: { $in: enrollments.map(e => e._id) }, paymentStatus: "paid" })
      .populate({
    path: "enrollment",
    populate: { path: "course", select: "title" }
  })
  .populate({
    path: "enrollment",
    populate: {
      path: "student",
      populate: { path: "user", select: "name email" }
    }
  });
    // إعداد البيانات للتصدير
    const csvData = payments.map(payment => {
      return {
        transactionId: payment._id,
        studentName: payment.enrollment.student.user.name,
        studentEmail: payment.enrollment.student.user.email,
        courseTitle: payment.enrollment.course.title,
        amount: payment.amount,
        status: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        date: payment.createdAt.toLocaleDateString(),
      };
    });
    const json2csv = new Parser();
    const csv = json2csv.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('successfullyPayments.csv');
    return res.send(csv);



  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
  
}

module.exports = {
  teacher_payments_get,
  teacher_payment_view_get,
  teacher_payment_view_course_get,
  teacher_payments_export_get,
  teacher_payments_by_course_export_get,
  teacher_pending_payments_export_get,
  teacher_paid_payments_export_get
};