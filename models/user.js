const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Student', 'Teacher', 'Admin'],
    default: 'Student'
  },
  profilePicture: { type: String }, // رابط الصورة الشخصية
}, { timestamps: true });

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// التحقق من كلمة المرور عند تسجيل الدخول
/*userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};*/

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
