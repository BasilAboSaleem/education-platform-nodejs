const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const lessonSchema = new Schema({
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String, // رابط الفيديو للدرس (اختياري حسب نوع الدرس)
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    order: {
      type: Number,
      default: 0, // ترتيب الدرس داخل الكورس
    },
    status: {
      type: String,
      enum: ['Under Review', 'Rejected', 'Published', 'Closed'],
      default: 'Under Review',
    },
    rejectionReason: { 
      type: String,
      default: null,
    },
  }, { timestamps: true });



  module.exports = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);