const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // إشارة لموديل اليوزر
    required: true,
  },
  status: {
    type: String,
    enum: ['Unverified', 'Active', 'Pending', 'Inactive'],
    default: 'Unverified',
  },
  
  phone: {
    type: String,
  },
  address: {
    type: String,
  }
}, { timestamps: true });


module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
