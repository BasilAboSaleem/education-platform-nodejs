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
     specialization: {
      type: String, 
      default: "",  
    },
    expertise: {
      type: [String], // مثلا ["Web Development", "Design", "Marketing"]
    },
    status: {
      type: String,
      enum: ['Unverified','Active', 'Pending', 'Inactive'],
      default: 'Unverified',
    },
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }],
    phone: String,
    address: String,
    social: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      facebook: { type: String, default: "" }
  }

  }, { timestamps: true });
  
  
  module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);