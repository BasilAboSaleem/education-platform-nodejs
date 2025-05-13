const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// تعريف الـ Schema للإشعارات
const notificationSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // تشير إلى موديل الـ User
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'], // حقل يحدد دور المستخدم
    required: true
  },
  isRead: {
    type: Boolean,
    default: false // حقل يحدد ما إذا كانت الإشعار مقروءة أم لا
  },
  createdAt: {
    type: Date,
    default: Date.now 
  }
});

// إنشاء الموديل بناءً على الـ Schema
module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);