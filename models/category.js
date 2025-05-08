const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
    image: {
        type: String, // رابط صورة الفئة (من Cloudinary مثلا)
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
      },
}, { timestamps: true });


module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);

