const User = require("../models/user");
const Student = require("../models/student");
const Teachers = require("../models/teacher");

const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const moment = require('moment');
const user = require("../models/user");
const Task = require("../models/task");


index_get = (req,res) => {
    res.render("index")
}
dashboard_get = async (req,res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    const tasks = await Task.find({ user: req.user._id });
    res.render("dashboard", { tasks , moment });
};

module.exports= {
    index_get ,
    dashboard_get,
   
   }