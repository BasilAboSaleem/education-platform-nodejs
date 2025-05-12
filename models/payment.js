const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['free', 'paid', 'unpaid'],
    default: 'free',
  },
  paymentMethod: {
    type: String,
    enum: ["paypal", "visa", "stripe", "bank", "cash"],
   
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: String,
    required: false, // إذا كنت ستستخدمه في حالة المدفوعات الناجحة
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
