const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const enrollmentSchema = new Schema({
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'completed'],
      default: 'pending',
    },
    
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    watchedLessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson"
    }],
    
    lastWatchedLesson: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Lesson" 
    },
  }, { timestamps: true });
  module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
