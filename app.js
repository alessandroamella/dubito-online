// PACKAGES SETUP
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride = require("method-override");

// MONGOOSE SETUP
mongoose.connect("mongodb://localhost:27017/dubito", { useNewUrlParser: true });

// DATABASE SETUP
var userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({extended: true}));

// SET VIEW ENGINE EJS
app.set("view engine", "ejs");

// SET PUBLIC FOLDER
app.use(express.static(__dirname + "/public"));

// METHOD OVERRIDE SETUP
app.use(methodOverride("_method"));

// PASSPORT SETUP
app.use(require("express-session")({
    secret: "Fiocchetto è il mio segreto",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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