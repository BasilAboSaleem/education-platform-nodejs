const express = require('express');
const router = express.Router();
const coreController = require("../controllers/core/coreController")
const {requireAuth} = require("../middlewares/authMiddleware")
const { check } = require("express-validator");

//home (index)
router.get("/", coreController.indexController.index_get );
router.post("/contact", coreController.indexController.contact_post);

//dashboard
router.get("/dashboard", requireAuth, coreController.dashboardController.dashboard_get );

module.exports = router;
