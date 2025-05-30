const express = require('express');
const router = express.Router();
const authController = require("../controllers/authControllers")
const { check, validationResult } = require("express-validator");
const {loginLimiter} = require("../middlewares/authMiddleware");



router.get("/register" , authController.regester_get)
router.post("/register",  [
    check("email", "Please provide a valid email").isEmail(),
    check(
      "password",
      "Password must be at least 8 characters with 1 upper case letter and 1 number"
    ).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
  ],
  authController.regester_post

)
router.get("/verify",  authController.verify_get)
router.post("/verify", authController.verify_post)
router.post("/verify/resend", authController.resend_verify_post)

router.get("/login" ,authController.login_get)
router.post("/login", loginLimiter, authController.login_post)
router.get("/forgot-password", authController.forgot_password_get)
router.post("/forgot-password", authController.forgot_password_post)
router.get("/reset-password", authController.reset_password_get)
router.post("/reset-password", [
    check("password", "Password must be at least 8 characters with 1 upper case letter and 1 number")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
    check("token", "Token is required").notEmpty()
  ],
   authController.reset_password_post)
router.get("/logout", authController.logout_get)

module.exports = router;
