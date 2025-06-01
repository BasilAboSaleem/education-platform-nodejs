const {User, Admin, Teacher, Student,
  check, validationResult, bcrypt, jwt, nodemailer, crypto
} = require("./utils");


login_get = (req, res) => {
    res.render("pages/auth/login")
}
login_post = async (req,res) => {
    try{
        const login = await User.findOne({email: req.body.email}) // تأكد من أن المستخدم تم التحقق منه
        if(!login){
            return res.json({notFoundEmail: "Not Found Email Plase Register"})
        }else{
            const isMatch = await bcrypt.compare(req.body.password , login.password)
            if(!isMatch){
                return res.json({errPassword: "Rong password"})
            }else{
                const token = jwt.sign({id: login._id}, process.env.JWTSECRET_KEY)
                res.cookie('jwt', token, {httpOnly:true, maxAge: 86400000})
              if (!login.isVerified) {
  req.session.userId = login._id;
  return res.json({ success: true, redirectTo: "/verify" });
}
                return res.json({ success: true, redirectTo: "/dashboard" }); // Redirect the user on success
               

            }
        }
       

    }
    catch(err){
        console.log(err);
    }
}

module.exports = {
    login_get,
    login_post
};