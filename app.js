// PACKAGES SETUP
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const socket = require("socket.io");
require('dotenv').config();

// LOAD ROUTES
const authRoutes = require("./routes/auth-routes");
const passportSetup = require("./config/passport-setup");
const profileRoutes = require("./routes/profile");
const mazzo = require("./models/mazzo");
const User = require('./models/user');
const middleware = require("./middleware");

// SET VIEW ENGINE EJS
app.set("view engine", "ejs");

// CONNECT MONGODB URI
mongoose.connect(process.env.mongoDBURI, { useNewUrlParser: true }, function(){
    console.log("Database connected!");
});

// SETUP EXPRESS SESSION AND CONNECT MONGO
app.use(session({
    secret: process.env.cooKey,
    resave: false,
    saveUninitialized: true,
    cookie: {},
    store: new MongoStore({
        url: process.env.mongoDBURI,
        ttl: 24*60*60
    })
}));

// CONNECT FLASH MESSAGES
app.use(flash());

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
    res.render("info")
});

app.get("/nuovapartita", middleware.controllaAccesso, function(req, res){
    res.render("newGame");
});

app.post("/nuovapartita", middleware.controllaAccesso, function(req, res){
    res.redirect("/dubito");
});

app.get("/dubito", middleware.controllaAccesso, function(req, res){
    res.render("partita");
});

app.put("/profilo/:id", middleware.controllaAccesso, function(req, res){
    // Trova e aggiorna nickname
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

// SOCKET SETUP
var io = socket(server);

var connessioni = 0;

var ids = [];

var players = [];

var turno = 0;

class Player {
    constructor(ip_pubblico, socket_id, nickname, mazzo) {
        this.ip_pubblico = ip_pubblico;
        this.socket_id = socket_id;
        this.nickname = nickname;
        this.mazzo = mazzo;
    }
}

io.on("connection", function(socket){

    connessioni += 1;
    if(connessioni <= 4){
        io.sockets.emit("nuovaConnessione", connessioni);
    }

    console.log("Nuova connessione dal socket", socket.id);
    ids.push(socket.id);
    socket.emit("id", {
        id: socket.id,
        giocatori: connessioni
    })

    var inGame = false;

    if(connessioni === 4){
        turno = 0;
        inGame = true;
        var mazzoTemp = [];
        var mazzo = require("./models/mazzo");
        for(var mazzoCount = 0; mazzoCount < mazzo.length; mazzoCount++){
            if(mazzoCount >= 0 && mazzoCount < 10){
                mazzoTemp.push(mazzo[mazzoCount]);
                if(mazzoCount == 9){
                    io.to(ids[0]).emit("carte", mazzoTemp);
                    // console.log(mazzoTemp);
                    mazzoTemp = [];
                };
            };
            if(mazzoCount >= 10 && mazzoCount < 20){
                mazzoTemp.push(mazzo[mazzoCount]);
                if(mazzoCount == 19){
                    io.to(ids[1]).emit("carte", mazzoTemp);
                    // console.log(mazzoTemp);
                    mazzoTemp = [];
                };
            }
            if(mazzoCount >= 20 && mazzoCount < 30){
                mazzoTemp.push(mazzo[mazzoCount]);
                if(mazzoCount == 29){
                    io.to(ids[2]).emit("carte", mazzoTemp);
                    // console.log(mazzoTemp);
                    mazzoTemp = [];
                };
            }
            if(mazzoCount >= 30 && mazzoCount < 40){
                mazzoTemp.push(mazzo[mazzoCount]);
                if(mazzoCount == 39){
                    io.to(ids[3]).emit("carte", mazzoTemp);
                    // console.log(mazzoTemp);
                    mazzoTemp = [];
                };
            }
        };

        io.sockets.emit("connessioni",{
            id1: ids[0],
            id2: ids[1],
            id3: ids[2],
            id4: ids[3]
        });

        io.to(ids[turno]).emit("turno", turno);

    };
    console.log(connessioni + " player");

    socket.on("cartaSend", function (data) {
        // Solo se è il turno del socket che emette la carta, allora emetti a tutti la carta inviata
        if (ids[turno] == socket.id) {
            socket.broadcast.emit("cartaReceive", data);
            // Aumenta il turno di uno, se il turno è pari al numero del giocatori totali, allora il giro ricomincia
            if (turno >= 0 && turno < ids.length - 1) {
                turno = turno + 1;
            } else if (turno == ids.length - 1) {
                turno = 0;
            } else {
                console.log("ATTENZIONE, numero turno invalido: " + turno);
                turno = 0;
            };
            console.log("Turno del giocatore " + (turno + 1).toString());
            socket.emit("senderSuccess", "Hai inviato la carta!");
            io.to(ids[turno]).emit("receiverSuccess", "Hai ricevuto la carta!");
            io.to(ids[turno]).emit("turno", turno);
        } else {
            // Se non è il turno del socket che emette la carta, allora emetti "noturno"
            socket.emit("noturno", true);
        };

    });

    // Tasto di debug per impostare a 0 il numero di socket connessi
    socket.on("reset", function(data){
        if(data.reset === true){
            connessioni = 0;
            ids = [];
            console.log("Connessioni resettate a " + connessioni);
        }
    });
});

