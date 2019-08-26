// PACKAGES SETUP
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var authRoutes = require("./routes/auth-routes");
var passportSetup = require("./config/passport-setup");

// SET VIEW ENGINE EJS
app.set("view engine", "ejs");

// CONNECT FLASH MESSAGES
app.use(flash());

// AUTH ROUTES
app.use("/autenticazione", authRoutes);

// MONGOOSE SETUP
mongoose.connect("mongodb://localhost:27017/dubito", { useNewUrlParser: true });

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({extended: true}));

// SET PUBLIC FOLDER
app.use(express.static(__dirname + "/public"));

// METHOD OVERRIDE SETUP
app.use(methodOverride("_method"));

// RESTful Routing
app.get("/", function(req, res){
    res.render("home");
});

app.get("/informazioni", function(req, res){
    res.render("info.ejs")
});

app.get("/nuovapartita", function(req, res){
    res.render("newGame.ejs");
});

app.post("/nuovapartita", function(req, res){
    res.redirect("/dubito");
});

app.get("/dubito", function(req, res){
    res.render("partita");
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Started!");
});