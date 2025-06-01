const { User, Student, Teachers, Course, Lesson, Category, Enrollment, Payment, Notification, Task,
  check, validationResult, bcrypt, jwt, moment, upload, cloudinary, fs, teacher,
  path, enrollment, Parser, send
} = require('./utils');


teacher_course_lessons_get = async (req, res) => {
    try{
       
        const course = await Course.findById(req.params.id)
        if(course.status === "Under Review" || course.status === "Rejected"){
            req.flash("error", "Your course is not active yet, please wait for admin approval.");
            return res.redirect(`/teacher/courses/view/${req.params.id}`);
        }
        const lessons = await Lesson.find({course: req.params.id}).populate("course");
        
        res.render("pages/teacher/course-lesoons", { course: course , moment: moment, lessons: lessons });

    }
    catch(err){
        console.log(err);
    }
} 

teacher_course_add_lesson_get = async (req, res) => {
    try{
        const course = await Course.findById(req.params.id);
        res.render("pages/teacher/add-lesson", { course: course });

    }
    catch(err){
        console.log(err);
    }
}

teacher_course_add_lesson_post = async (req, res) => {
    try{
        const newLesson = await Lesson.create({
            title: req.body.title,
            content: req.body.content,
            videoUrl: req.body.videoUrl,
            course: req.params.id,
            order: req.body.order,
            status: "Under Review",
        });
    
        // Update the course with the new lesson ID
        await Course.findByIdAndUpdate(req.params.id, {
            $push: { lessons: newLesson._id }
        }, { new: true }); 
        req.flash("success", "Lesson added successfully");
        console.log(newLesson);

        res.redirect(`/teacher/courses/${req.params.id}/lessons`);
    }
    catch(err){
        console.log(err);
    }
}

teacher_course_lesson_view_get = async (req, res) => {
    try{
        const lesson = await Lesson.findById(req.params.id).populate("course");
        res.render("pages/teacher/lesson_view", { lesson: lesson , moment: moment, course: lesson.course });

    }
    catch(err){
        console.log(err);
    }
}

teacher_course_lesson_edit_get = async (req, res) => {
    try{
        const lesson = await Lesson.findById(req.params.id).populate("course");
        res.render("pages/teacher/edit_lesson", { lesson: lesson , moment: moment, course: lesson.course });

    }
    catch(err){
        console.log(err);
    }
}

teacher_course_lesson_edit_put = async (req, res) => {
    try{
        const lesson = await Lesson.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            content: req.body.content,
            videoUrl: req.body.videoUrl,
            order: req.body.order,
            status: "Under Review",
        }, { new: true }).populate("course");
    
        req.flash("success", "Lesson updated successfully");
        console.log(lesson);
        res.redirect(`/teacher/courses/${lesson.course._id}/lessons`);
    }
    catch(err){
        console.log(err);
    }
}

module.exports = {
    teacher_course_lessons_get,
    teacher_course_add_lesson_get,
    teacher_course_add_lesson_post,
    teacher_course_lesson_view_get,
    teacher_course_lesson_edit_get,
    teacher_course_lesson_edit_put
};