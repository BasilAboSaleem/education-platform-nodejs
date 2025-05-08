const express = require('express');
const router = express.Router();
const coreController = require("../controllers/coreController")
const {requireAuth} = require("../middlewares/authMiddleware")
const { check } = require("express-validator");

router.get("/", coreController.index_get );

router.get("/dashboard", requireAuth, coreController.dashboard_get );

module.exports = router;
