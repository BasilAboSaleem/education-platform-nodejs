const express = require('express');
const router = express.Router();
const {requireAuth , isStudent} = require("../middlewares/authMiddleware")
const studentController = require("../controllers/studentController")
const { check } = require("express-validator");
const multer = require('multer');
const upload = multer({storage: multer.diskStorage({})});

router.get("/student/all-courses", requireAuth, isStudent, studentController.student_allCourses_get);
router.get("/student/all-courses/free", requireAuth, isStudent, studentController.student_allCourses_free_get);
router.get("/student/all-courses/category/:id", requireAuth, isStudent, studentController.student_allCourses_category_get);
router.get("/student/all-courses/courseDetails/:id", requireAuth, isStudent, studentController.student_allCourses_courseDetails_get);
router.post("/student/all-courses/course/:id/enroll", requireAuth, isStudent, studentController.student_enroll_course_post);
router.get("/student/my-courses", requireAuth, isStudent, studentController.student_myCourses_get);
router.get("/student/my-courses/courseDetails/:id", requireAuth, isStudent, studentController.student_myCourses_courseDetails_get);
router.get("/student/course/:id/lesson/:lessonId", requireAuth, isStudent, studentController.student_course_lesson_get);
router.get("/student/course/:id/payment", requireAuth, isStudent, studentController.student_course_payment_get);
router.post("/student/course/:id/payment", requireAuth, isStudent, studentController.student_course_payment_post);
router.get("/student/payments", requireAuth, isStudent, studentController.student_payments_get);
//router.get("/student/all-courses/course/:id/enroll", requireAuth, isStudent, studentController.student_enroll_course_post);
router.get("/student/notifications", requireAuth, isStudent, studentController.student_notifications_get);
router.get("/student/profile", requireAuth, isStudent, studentController.student_profile_get);
router.get("/student/profile/edit", requireAuth, isStudent, studentController.student_profile_edit_get);
router.put("/student/profile/edit", requireAuth, isStudent, upload.single('profilePicture'), studentController.student_profile_edit_put);
router.post("/student/addTask", requireAuth, isStudent, studentController.student_addTask_post);
router.delete("/student/deleteTask/:id", requireAuth, isStudent, studentController.student_deleteTask_delete);
router.put("/student/tasks/:id/update-status", requireAuth, isStudent, studentController.student_updateTaskStatus_put);

module.exports = router;