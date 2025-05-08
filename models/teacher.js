const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    expertise: {
      type: [String], // مثلا ["Web Development", "Design", "Marketing"]
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Inactive'],
      default: 'Pending',
    },
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }],
    phone: String,
    address: String,
  }, { timestamps: true });
  
  
  module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);