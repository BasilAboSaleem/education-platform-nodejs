const express = require('express');
const router = express.Router();
const adminController = require("../controllers/admin/adminController")
const {requireAuth , isAdmin} = require("../middlewares/authMiddleware")
const { check } = require("express-validator");
const multer = require('multer');
const upload = multer({storage: multer.diskStorage({})}); 

//routs for admin
router.get("/admin/students", requireAuth, isAdmin, adminController.studentsController.admin_students_get );
router.get("/admin/students/view/:id", requireAuth, isAdmin, adminController.studentsController.admin_students_view_get );
router.get("/admin/students/edit/:id", requireAuth, isAdmin, adminController.studentsController.admin_students_edit_get );
router.put("/admin/students/edit/:id", requireAuth, isAdmin, adminController.studentsController.admin_students_edit_put );
router.delete("/admin/students/delete/:id", requireAuth, isAdmin, adminController.studentsController.admin_students_delete );
router.put("/admin/students/status/:id", requireAuth, isAdmin, adminController.studentsController.admin_students_status_put );
router.post("/admin/students/search" , requireAuth, isAdmin, adminController.studentsController.admin_students_search_post );
router.get("/admin/teachers", requireAuth, isAdmin, adminController.teachersController.admin_teachers_get );
router.get("/admin/teachers/view/:id", requireAuth, isAdmin, adminController.teachersController.admin_teachers_view_get );
router.get("/admin/teachers/edit/:id", requireAuth, isAdmin, adminController.teachersController.admin_teachers_edit_get );
router.put("/admin/teachers/edit/:id", requireAuth, isAdmin, adminController.teachersController.admin_teachers_edit_put );
router.delete("/admin/teachers/delete/:id", requireAuth, isAdmin, adminController.teachersController.admin_teachers_delete );
router.put("/admin/teachers/status/:id", requireAuth, isAdmin, adminController.teachersController.admin_teachers_status_put );
router.post("/admin/teachers/search" , requireAuth, isAdmin, adminController.teachersController.admin_teachers_search_post );
router.get("/admin/teachers/search", requireAuth, isAdmin, adminController.teachersController.admin_teachers_search_get );
router.get("/admin/add-teacher", requireAuth, isAdmin, adminController.teachersController.admin_add_teacher_get );
router.post("/admin/add-teacher",[ 
    check("email", "Please provide a valid email").isEmail(),
    check(
      "password",
      "Password must be at least 8 characters with 1 upper case letter and 1 number"
    ).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
  ], requireAuth, isAdmin, adminController.teachersController.admin_add_teacher_post );
router.get("/admin/categories/add-category", requireAuth, isAdmin, adminController.categoriesController.admin_add_category_get );
router.post("/admin/categories/add-category", requireAuth, isAdmin, upload.single('image'),adminController.categoriesController.admin_add_category_post );
router.get("/admin/categories", requireAuth, isAdmin, adminController.categoriesController.admin_categories_get );
router.get("/admin/categories/view/:id", requireAuth, isAdmin, adminController.categoriesController.admin_categories_view_get );
router.get("/admin/categories/edit/:id", requireAuth, isAdmin, adminController.categoriesController.admin_categories_edit_get );
router.put("/admin/categories/edit/:id", requireAuth, isAdmin, upload.single('image'),adminController.categoriesController.admin_categories_edit_put );
router.delete("/admin/categories/delete/:id", requireAuth, isAdmin, adminController.categoriesController.admin_categories_delete );
router.put("/admin/categories/status/:id", requireAuth, isAdmin, adminController.categoriesController.admin_categories_status_put );
router.get("/admin/categories/search", requireAuth, isAdmin, adminController.categoriesController.admin_categories_search_get );
router.post("/admin/categories/search" , requireAuth, isAdmin, adminController.categoriesController.admin_categories_search_post );
router.get("/admin/pending-courses", requireAuth, isAdmin, adminController.coursesController.admin_pending_courses_get );
router.get("/admin/pending-courses/view/:id", requireAuth, isAdmin, adminController.coursesController.admin_pending_courses_view_get );
router.put("/admin/pending-courses/view/status/publish/:id", requireAuth, isAdmin, adminController.coursesController.admin_pending_courses_publish_put );
router.put("/admin/pending-courses/view/status/reject/:id", requireAuth, isAdmin, adminController.coursesController.admin_pending_courses_reject_put );
router.get("/admin/courses", requireAuth, isAdmin, adminController.coursesController.admin_courses_get );
router.get("/admin/courses/view/:id", requireAuth, isAdmin, adminController.coursesController.admin_courses_view_get );
router.get("/admin/courses/:id/lessons", requireAuth, isAdmin, adminController.coursesController.admin_courses_lessons_get );
router.get("/admin/courses/search", requireAuth, isAdmin, adminController.coursesController.admin_courses_search_get );
router.post("/admin/courses/search", requireAuth, isAdmin, adminController.coursesController.admin_courses_search_post );
router.put("/teacher/courses/status/:id", requireAuth, isAdmin, adminController.coursesController.admin_courses_status_put );
router.get("/admin/pending-lessons", requireAuth, isAdmin, adminController.lessonsController.admin_pending_lessons_get );
router.get("/admin/pending-lessons/view/:id", requireAuth, isAdmin, adminController.lessonsController.admin_pending_lessons_view_get );
router.put("/admin/pending-lessons/view/status/publish/:id", requireAuth, isAdmin, adminController.lessonsController.admin_pending_lessons_publish_put );
router.put("/admin/pending-lessons/view/status/reject/:id", requireAuth, isAdmin, adminController.lessonsController.admin_pending_lessons_reject_put );
router.get("/admin/courses/:id/lessons/view/:id", requireAuth, isAdmin, adminController.lessonsController.admin_courses_lessons_view_get );
router.put("/admin/course-lessons/view/status/reject/:id", requireAuth, isAdmin, adminController.lessonsController.admin_course_lessons_reject_put );
router.get("/admin/payments", requireAuth, isAdmin, adminController.paymentsController.admin_payments_get );
router.get("/admin/payments/view/:id", requireAuth, isAdmin, adminController.paymentsController.admin_payments_view_get );
router.get("/admin/payments/export", requireAuth, isAdmin, adminController.paymentsController.admin_payments_export_get );
router.get("/admin/payments/view-course/:id", requireAuth, isAdmin, adminController.paymentsController.admin_payments_view_course_get );
router.get("/admin/payments/paymentsByCourse/export", requireAuth, isAdmin, adminController.paymentsController.admin_payments_paymentsByCourse_export_get );
router.get("/admin/payments/pendingPayments/export", requireAuth, isAdmin, adminController.paymentsController.admin_payments_pendingPayments_export_get );
router.get("/admin/payments/successfulPayments/export", requireAuth, isAdmin, adminController.paymentsController.admin_payments_successfulPayments_export_get );
router.get("/admin/send-notification", requireAuth, isAdmin, adminController.notificationsController.admin_send_notification_get );
router.post("/admin/send-notification", requireAuth, isAdmin, adminController.notificationsController.admin_send_notification_post );
router.get("/admin/notifications", requireAuth, isAdmin, adminController.notificationsController.admin_notifications_get );
router.get("/admin/profile", requireAuth, isAdmin, adminController.profileController.admin_profile_get );
router.get("/admin/profile/edit", requireAuth, isAdmin, adminController.profileController.admin_profile_edit_get );
router.put("/admin/profile/edit", requireAuth, isAdmin, upload.single('profilePicture'), adminController.profileController.admin_profile_edit_put );
router.get("/admin/settings", requireAuth, isAdmin, adminController.settingsController.admin_settings_get );
router.put("/admin/settings", requireAuth, isAdmin, adminController.settingsController.admin_settings_put );
router.post("/admin/addTask", requireAuth, isAdmin, adminController.tasksController.admin_addTask_post);
router.delete("/admin/deleteTask/:id", requireAuth, isAdmin, adminController.tasksController.admin_deleteTask_delete);
router.put("/admin/tasks/:id/update-status", requireAuth, isAdmin, adminController.tasksController.admin_updateTaskStatus_put);
router.delete("/admin/delete-userUnverified/:id", requireAuth, isAdmin, adminController.userUnverifiedController.admin_delete_userUnverified_delete);

module.exports = router;