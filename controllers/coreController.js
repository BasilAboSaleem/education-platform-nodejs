const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");

const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const moment = require('moment');


index_get = (req,res) => {
    res.render("index")
}
dashboard_get = (req,res) => {
    res.render("dashboard")
    
}

module.exports= {
    index_get ,
    dashboard_get,
   
   }