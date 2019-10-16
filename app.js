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
var socket = require("socket.io")

// LOAD ROUTES
var authRoutes = require("./routes/auth-routes");
var passportSetup = require("./config/passport-setup");
var profileRoutes = require("./routes/profile");
const User = require('./models/user');
var middleware = require("./middleware");

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

app.get("/nuovapartita", middleware.controllaAccesso, function(req, res){
    res.render("newGame.ejs");
});

app.post("/nuovapartita", middleware.controllaAccesso, function(req, res){
    res.redirect("/dubito");
});

app.get("/dubito", middleware.controllaAccesso, function(req, res){
    res.render("partita");
});

app.put("/profilo/:id", middleware.controllaAccesso, function(req, res){
    // find and update the correct campground
    User.findOneAndUpdate({_id: req.params.id}, {
        nickname: req.body.nickname
    }, function(err, updatedNick){
       if(err){
           req.flash("error", err);
           console.log(err.toString());
           res.redirect("/profilo");
       } else {
           // REDIRECT TO PROFILE
           req.flash("success", "Salve, " + req.body.nickname + "!");
           res.redirect("/profilo");
       }
    });
});

app.get("*", function(req, res){
    res.render("404");
});



var server = app.listen(process.env.PORT, process.env.IP, function () {
  console.log("Server Started!");
});

// var port = process.env.PORT || 3000;
// var server = app.listen(port, function () {
//   console.log("Server Started!");
// });

// SOCKET SETUP
var io = socket(server);

var connessioni = 0;

var ids = [];

io.on("connection", function(socket){
    connessioni += 1;
    if(connessioni <= 4){
        socket.emit("disponibile", {});
    }

    if(connessioni === 1){
        socket.emit("primo", {});
    }

    console.log("New connection from socket", socket.id);
    ids.push(socket.id);
    socket.emit("id", {
        id: socket.id,
        giocatori: connessioni
    })
    if(connessioni === 4){
        io.sockets.emit("connessioni",{
            maxPlayers: true,
            id1: ids[0],
            id2: ids[1],
            id3: ids[2],
            id4: ids[3]
        });

    }
    console.log(connessioni + " player");

    socket.on("reset", function(data){
        if(data.reset === true){
            connessioni = 0;
            ids = [];
            console.log("Connessioni resettate a " + connessioni);
        }
    });
});

