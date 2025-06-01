const {
  User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload, cloudinary, fs, render 
} = require('./utils');


student_addTask_post = async (req, res) => {
  try{
    const { title, dueDate } = req.body;
    const task = await Task.create({
      title,
      dueDate,
      user: req.user._id,
    });
    req.flash("success", "Task added successfully");
    res.redirect("/dashboard");


  }
  catch(err){
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
student_deleteTask_delete = async (req, res) => {
  try {
    const taskId = req.params.id; // الحصول على الـ id من الرابط
    const task = await Task.findById(taskId); // جلب المهمة
    if (!task) {
      req.flash("error", "Task not found.");
      return res.redirect("/dashboard");
    }

    // حذف المهمة
    await Task.findByIdAndDelete(taskId);
    req.flash("success", "Task deleted successfully.");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error deleting task:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
student_updateTaskStatus_put = async (req, res) => {
  try{
    const { id } = req.params;
  const { status } = req.body;

  if (!['done', 'expired'].includes(status)) {
    return req.flash("error", "Invalid status");
  }
   const updatedTask = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return req.flash("error", "Task not found");
    }

    req.flash("success", "Task status updated successfully");
    res.redirect("/dashboard");


  }
  catch(err){
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  student_addTask_post,
  student_deleteTask_delete,
  student_updateTaskStatus_put,
};

