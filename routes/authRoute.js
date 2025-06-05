const express = require('express');
const router = express.Router();
const authController = require("../controllers/auth/authController"); 
const { check, validationResult } = require("express-validator");
const {loginLimiter} = require("../middlewares/authMiddleware");


//register
router.get("/register" , authController.registerController.regester_get)
router.post("/register",  [
    check("email", "Please provide a valid email").isEmail(),
    check(
      "password",
      "Password must be at least 8 characters with 1 upper case letter and 1 number"
    ).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
  ],
  authController.registerController.regester_post

)

//verify
router.get("/verify",  authController.verifyController.verify_get)
router.post("/verify", authController.verifyController.verify_post)
router.post("/verify/resend", authController.verifyController.resend_verify_post)

//login
router.get("/login" ,authController.loginController.login_get)
router.post("/login", loginLimiter, authController.loginController.login_post)

//password
router.get("/forgot-password", authController.passwordController.forgot_password_get)
router.post("/forgot-password", authController.passwordController.forgot_password_post)
router.get("/reset-password", authController.passwordController.reset_password_get)
router.post("/reset-password", [
    check("password", "Password must be at least 8 characters with 1 upper case letter and 1 number")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
    check("token", "Token is required").notEmpty()
  ],
   authController.passwordController.reset_password_post)

   //logout
router.get("/logout", authController.logoutController.logout_get)

module.exports = router;
