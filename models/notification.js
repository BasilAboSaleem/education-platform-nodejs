const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const notificationSchema = new Schema({
  title: {
    type: String,
    default: null
  },
  message: {
    type: String,
    required: true
  },

  // لمستخدم معيّن
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // لإشعار عام لمجموعة (طلاب، معلمين، أو الجميع)
  targetRole: {
    type: String,
    enum: ['student', 'teacher', 'all'],
    default: null
  },

  // للكورسات
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },

  // رابط اختياري
  link: {
    type: String,
    default: null
  },

  // تم قراءته؟
  isRead: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
