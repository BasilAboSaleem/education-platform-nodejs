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
router.delete("/teacher/courses/delete/:id" , requireAuth, isTeacher, teacherController.teacher_course_delete);
router.put("/teacher/course/status/:id", requireAuth, isTeacher, teacherController.teacher_course_status_put);
router.get("/teacher/studentEnrollments", requireAuth, isTeacher, teacherController.teacher_student_enrollments_get);
router.get("/teacher/studentEnrolment/:id", requireAuth, isTeacher, teacherController.teacher_student_enrollment_view_get);
router.get("/teacher/payments", requireAuth, isTeacher, teacherController.teacher_payments_get);
router.get("/teacher/payments/view/:id", requireAuth, isTeacher, teacherController.teacher_payment_view_get);
router.get("/teacher/payments/view-course/:id", requireAuth, isTeacher, teacherController.teacher_payment_view_course_get);
router.get("/teacher/payments/export", requireAuth, isTeacher, teacherController.teacher_payments_export_get);
router.get("/teacher/payments/paymentsByCourse/export", requireAuth, isTeacher, teacherController.teacher_payments_by_course_export_get);
router.get("/teacher/payments/pendingPayments/export", requireAuth, isTeacher, teacherController.teacher_pending_payments_export_get);
router.get("/teacher/payments/successfulPayments/export", requireAuth, isTeacher, teacherController.teacher_paid_payments_export_get);
router.get("/teacher/send-notification", requireAuth, isTeacher, teacherController.teacher_send_notification_get);
router.post("/teacher/send-notification", requireAuth, isTeacher, teacherController.teacher_send_notification_post);
router.get("/teacher/notifications", requireAuth, isTeacher, teacherController.teacher_notifications_get);
router.get("/teacher/profile", requireAuth, isTeacher, teacherController.teacher_profile_get);
router.get("/teacher/profile/edit", requireAuth, isTeacher, teacherController.teacher_profile_edit_get);
router.put("/teacher/profile/edit", requireAuth, isTeacher, upload.single('profilePicture'), teacherController.teacher_profile_edit_put);
module.exports = router;
