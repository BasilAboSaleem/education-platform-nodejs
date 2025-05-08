const express = require('express');
const router = express.Router();
const authController = require("../controllers/authControllers")
const { check, validationResult } = require("express-validator");



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

router.get("/login" ,authController.login_get)
router.post("/login", authController.login_post)
router.get("/logout", authController.logout_get)
module.exports = router;
