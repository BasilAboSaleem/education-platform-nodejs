const User = require("../../models/user");
const Admin = require("../../models/admin");
const Teacher = require("../../models/teacher");
const Student = require("../../models/student");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

module.exports = {
  User,
  Admin,
  Teacher,
  Student,
  check,
  validationResult,
  bcrypt,
  jwt,
  nodemailer,
  crypto
};