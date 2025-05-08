const User = require("../models/user");
const Admin = require("../models/admin");
const Teacher = require("../models/teacher");
const Student = require("../models/student");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");

regester_get= (req,res) => {
    res.render("pages/auth/regester")
}
regester_post = async (req,res) => {
    try{
        console.log("Request Body:", req.body);

        const curruntEmail = await User.findOne({email: req.body.email})
        if(curruntEmail){
            console.log("email exsist");
           return res.json({existEmail: "Email already exist, Try to login"})
        }
        const objErr = validationResult(req) 
        if(objErr.errors.length >0){
            console.log(objErr);
            return res.json({objErr: objErr.errors})
        }
        const newuser = await User.create(req.body)
        //بعد انشاء اليوزر في الداتا بيز بدي افحص نوع الرولز وانشئ حسب الرولز أوبجيكت من نوعه
       if(newuser.role === "Admin"){
        const newAdmin = await Admin.create({user: newuser._id})
        console.log(newAdmin);
       } else if(newuser.role === "Teacher") {
        const newTeacher = await Teacher.create({user: newuser._id })
        console.log(newTeacher);
       } else if(newuser.role === "Student") {
        const newStudent = await Student.create({user: newuser._id})
        console.log(newStudent);
       }
        console.log(newuser);
        return res.json({ success: true, redirectTo: "/login" }); // Redirect the user on success




    }
    catch(err){
        console.log(err);
    }
}
login_get =  (req,res) => {
    res.render("pages/auth/login")
}
login_post = async (req,res) => {
    try{
        const login = await User.findOne({email: req.body.email})
        if(!login){
            console.log("Not Found Email Plase Register");
            return res.json({notFoundEmail: "Not Found Email Plase Register"})
        }else{
            const isMatch = await bcrypt.compare(req.body.password , login.password)
            if(!isMatch){
                console.log("Rong password");
                return res.json({errPassword: "Rong password"})
            }else{
                const token = jwt.sign({id: login._id}, process.env.JWTSECRET_KEY)
                res.cookie('jwt', token, {httpOnly:true, maxAge: 86400000})
                console.log("don token");
                return res.json({ success: true, redirectTo: "/dashboard" }); // Redirect the user on success
               

            }
        }
       

    }
    catch(err){
        console.log(err);
    }
}
logout_get = (req, res) => {
    
        res.clearCookie('connect.sid');
        res.clearCookie('jwt');
        // إعادة توجيه المستخدم بعد تسجيل الخروج
        res.redirect('/login'); // أو المسار الذي تريد توجيه المستخدم إليه
};
module.exports ={regester_get,regester_post,login_post,login_get,logout_get}