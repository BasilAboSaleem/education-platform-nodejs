const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String, // رابط صورة الكورس (من Cloudinary مثلا)
    },
    category:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
   
    status: {
      type: String,
      enum: ['Under Review', 'Rejected', 'Published', 'Closed'],
      default: 'Under Review',
    },
    lessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    rejectionReason: { 
      type: String,
     default: null 
    }, // إضافة حقل سبب الرفض
  }, { timestamps: true });

  
module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
  