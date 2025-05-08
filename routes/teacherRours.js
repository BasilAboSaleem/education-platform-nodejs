const express = require('express');
const router = express.Router();
const {requireAuth , isTeacher} = require("../middlewares/authMiddleware")
const teacherController = require("../controllers/teacherController")
const { check } = require("express-validator");
const multer = require('multer');
const upload = multer({storage: multer.diskStorage({})});

router.get("/teacher/add-course", requireAuth, isTeacher, teacherController.teacher_addCourse_get);
router.post("/teacher/add-course", requireAuth, isTeacher, upload.single('image'), teacherController.teacher_addCourse_post);
router.get("/teacher/courses", requireAuth, isTeacher, teacherController.teacher_courses_get);
router.get("/teacher/courses/view/:id", requireAuth, isTeacher, teacherController.teacher_course_view_get);
router.get("/teacher/courses/edit/:id", requireAuth, isTeacher, teacherController.teacher_course_edit_get);
router.put("/teacher/courses/edit/:id", requireAuth, isTeacher, upload.single('image'), teacherController.teacher_course_edit_put);
router.get("/teacher/courses/:id/lessons", requireAuth, isTeacher, teacherController.teacher_course_lessons_get);
router.get("/teacher/courses/:id/addLesson", requireAuth, isTeacher, teacherController.teacher_course_add_lesson_get);
router.post("/teacher/courses/:id/addLesson", requireAuth, isTeacher, teacherController.teacher_course_add_lesson_post);
router.get("/teacher/courses/:id/lessons/view/:id" , requireAuth, isTeacher, teacherController.teacher_course_lesson_view_get);
router.get("/teacher/courses/:id/lessons/edit/:id", requireAuth, isTeacher, teacherController.teacher_course_lesson_edit_get);
router.put("/teacher/courses/:id/lessons/edit/:id", requireAuth, isTeacher, teacherController.teacher_course_lesson_edit_put);
//router.put("/teacher/courses/status/:id", requireAuth,  teacherController.teacher_course_status_put);
router.delete("/teacher/courses/delete/:id" , requireAuth, isTeacher, teacherController.teacher_course_delete);
router.put("/teacher/course/status/:id", requireAuth, isTeacher, teacherController.teacher_course_status_put);

module.exports = router;
