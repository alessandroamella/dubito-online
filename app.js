// PACKAGES SETUP
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var mongoose = require("mongoose");
var cookieSession = require("cookie-session");

// LOAD ROUTES
var authRoutes = require("./routes/auth-routes");
var passportSetup = require("./config/passport-setup");
var profileRoutes = require("./routes/profile");
const User = require('./models/user');

// SET VIEW ENGINE EJS
app.set("view engine", "ejs");

// CONNECT FLASH MESSAGES
app.use(flash());

// SETUP COOKIE SESSION
app.use(cookieSession({
    maxAge: 24*60*60*1000,
    keys: [process.env.cooKey]
}));

// INITIALIZE PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// GLOBAL
app.use(function(req, res, next){
    res.locals.utente = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
 });

// CONNECT MONGODB URI
mongoose.connect(process.env.mongoDBURI, { useNewUrlParser: true }, function(){
    console.log("Database connected!");
});

// AUTH ROUTES
app.use("/autenticazione", authRoutes);

// PROFILE ROUTES
app.use("/profilo", profileRoutes);

// MONGOOSE SETUP
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());

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

var controllaAccesso = function (req, res, next) {
    if (!req.user) {
        // If user is not logged in
        res.redirect("/autenticazione/google");
    } else {
        next();
    }
}

app.post("/profilo/:id", controllaAccesso, function(req, res){
    // find and update the correct campground
    User.findOneAndUpdate(req.params.id, {
        _id: req.user._id,
        googleId: req.user.googleId,
        username: req.user.username,
        nickname: req.body.nickname
    }, function(err, updatedNick){
       if(err){
           res.redirect("/");
           req.flash("error", err);
           res.redirect("/profilo");
       } else {
           // REDIRECT TO PROFILE
           req.flash("success", "Salve, " + req.body.nickname + "!");
           res.redirect("/profilo");
       }
    });
});

app.listen(process.env.PORT, process.env.IP, function () {
  console.log("Server Started!");
});

// var port = process.env.PORT || 3000;
// app.listen(port, function () {
//   console.log("Server Started!");
// });