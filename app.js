// PACKAGES SETUP
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var User = require("./models/user")

// CONNECT FLASH MESSAGES
app.use(flash());

// MONGOOSE SETUP
mongoose.connect("mongodb://localhost:27017/dubito", { useNewUrlParser: true });

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

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
 });

// RESTful Routing
app.get("/", function(req, res){
    res.render("home");
});

app.get("/registrazione", function(req, res){
    res.render("signup");
});

app.post("/signup", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/registrazione");
          }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Benvenuto su Dubito Online " + user.username);
           res.redirect("/"); 
        });
    });
});


// LOGIN FORM
app.get("/login", function(req, res){
    res.render("login"); 
 });
 

 // LOGIN LOGIC
 app.post("/login", passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res){})
 
//  LOGOUT
 app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
 });
 
//  ISLOGGEDIN MIDDLEWARE
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     req.flash("error", "Devi fare il login per continuare");
     res.redirect("/login");
 }

app.get("/informazioni", function(req, res){
    res.render("info.ejs")
});

app.get("/nuovapartita", isLoggedIn, function(req, res){
    res.render("newGame.ejs");
});

app.post("/nuovapartita", isLoggedIn, function(req, res){
    res.redirect("/dubito");
});

app.get("/dubito", isLoggedIn, function(req, res){
    res.render("partita");
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Started!");
});