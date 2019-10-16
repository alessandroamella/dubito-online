var express = require("express");
var router = express.Router();
var User = require('../models/user');
var middleware = require("../middleware");


router.get("/", middleware.controllaAccesso, function (req, res) {
    res.render("profilo", { utente: req.user });
});

module.exports = router;