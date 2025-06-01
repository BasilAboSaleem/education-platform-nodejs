const { User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, upload, cloudinary, fs, teacher,
  path, enrollment, Parser, send
} = require('./utils');


teacher_profile_get = async (req, res) => {
  try{
    const user = await User.findById(req.user._id).select("name email profilePicture createdAt")
    const teacher = await Teachers.findOne({ user: req.user._id }).select("address phone status social expertise bio")
    res.render("pages/teacher/profile/my-profile" , { user , teacher, moment})

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}
teacher_profile_edit_get = async (req, res) => {
  try{
    const user = await User.findById(req.user._id).select("name email profilePicture ")
    const teacher = await Teachers.findOne({ user: req.user._id }).select("address phone status social expertise bio specialization")
    res.render("pages/teacher/profile/edit-profile" , { user , teacher})

  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
}

teacher_profile_edit_put = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email profilePicture profilePicturePublicId password");
    const teacher = await Teachers.findOne({ user: req.user._id });
 
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    if (!teacher) {
      req.flash('error', 'Teacher profile not found');
      return res.redirect('/teacher/profile/edit');
    }

    const updatedUserData = {
      name: req.body.name ?? user.name,
      email: req.body.email ?? user.email,
      profilePicture: user.profilePicture, 
      profilePicturePublicId: user.profilePicturePublicId, // حافظ عليه أيضاً
      
    };

    if (req.file) {
      // حذف الصورة القديمة باستخدام public_id الصحيح
      if (user.profilePicturePublicId) {
        try {
          await cloudinary.uploader.destroy(user.profilePicturePublicId);
        } catch (err) {
          console.error("Error deleting old image from Cloudinary:", err);
        }
      }

      // رفع الصورة الجديدة
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "LMS/courses",
        use_filename: true,
        unique_filename: false,
      });

      updatedUserData.profilePicture = uploadResult.secure_url;
      updatedUserData.profilePicturePublicId = uploadResult.public_id;
    }

    if (req.body.password && req.body.password.trim() !== "") {
      const password = req.body.password.trim();

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
      if (!passwordRegex.test(password)) {
        req.flash(
          "error",
          "Password must be at least 8 characters with 1 upper case letter, 1 number, and 1 special character."
        );
        return res.redirect("/teacher/profile/edit");
      }

      updatedUserData.password = password; //سيتم تشفير الكلمة في المودل
    } else {
      updatedUserData.password = user.password;
    }

  //تحديث بيانات اليوزر مع تشفير كلمة المرور في المودل 
  Object.assign(user, updatedUserData);
await user.save();

    const updatedTeacher = await Teachers.findOneAndUpdate(
      { user: req.user._id },
      {
        phone: req.body.phone ?? teacher.phone,
        address: req.body.address ?? teacher.address,
        bio: req.body.bio ?? teacher.bio,
        specialization: req.body.specialization ?? teacher.specialization,
        expertise: req.body.expertise ?? teacher.expertise,
        social: {
          facebook: req.body.facebook ?? teacher.social.facebook,
          twitter: req.body.twitter ?? teacher.social.twitter,
          linkedin: req.body.linkedin ?? teacher.social.linkedin,
          instagram: req.body.instagram ?? teacher.social.instagram,
        },

      },
      { new: true }
    ).select("phone address");

    req.flash("success", "Profile updated successfully");
    res.redirect("/teacher/profile");

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  teacher_profile_get,
  teacher_profile_edit_get,
  teacher_profile_edit_put
};