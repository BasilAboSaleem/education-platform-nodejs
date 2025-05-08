const mongoose = require('mongoose');
const  Schema  = mongoose.Schema;

const adminSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // ربط الموديل مع موديل User
    required: true,
  },
  role: {
    type: String,
    default: 'admin',  // تأكيد أن هذا هو أدمن
  },
  dateAssigned: {
    type: Date,
    default: Date.now,  // تاريخ تعيين الأدمن
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',  // يمكن إضافة مرجع لأدمن آخر عيّن هذا الأدمن
  },
  permissions: {
    manageUsers: {
      type: Boolean,
      default: true,  // الأدمن يستطيع إدارة المستخدمين
    },
    manageCourses: {
      type: Boolean,
      default: true,  // الأدمن يستطيع إدارة الدورات
    },
    managePayments: {
      type: Boolean,
      default: true,  // الأدمن يستطيع إدارة المدفوعات
    },
    // يمكن إضافة صلاحيات أخرى حسب الحاجة
  },
  notes: {
    type: String,
    default: '',  // يمكن تخزين ملاحظات أدمن حول صلاحيات أو معلومات إضافية
  }
}, { timestamps: true });

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

/*const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;*/
