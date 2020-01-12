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
const cookieParser = require('cookie-parser');
const passportSocketIo = require("passport.socketio");
const log = require('simple-node-logger').createSimpleLogger('server.log');
const request = require('request');
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

// USE COOKIE PARSER
app.use(cookieParser(process.env.cooKey));

// CONNECT MONGODB URI
mongoose.connect(process.env.mongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true }, function(){
    console.log("Database connected!");
});

mongoStore = new MongoStore({
    url: process.env.mongoDBURI,
    ttl: 24*60*60
});

// SETUP EXPRESS SESSION AND CONNECT MONGO
app.use(session({
    key: "connect.sid",
    secret: process.env.cooKey,
    resave: false,
    saveUninitialized: true,
    cookie: {},
    store: mongoStore
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

function getCats(res) {
    var catCount = 5;
    var catArray = [];
    return new Promise(function (resolve, reject) {
        for (var i = 0; i < 5; i++) {
            request({
                url: 'https://api.thecatapi.com/v1/images/search',
                headers: {
                    'x-api-key': process.env.catKey
                }
            }, function(error, response, body){
                if(error){
                    console.log("Errore nella ricerca di un gatto:");
                    reject(error);
                    res.redirect("/");
                } else {
                    catCount--;
                    catArray.push(JSON.parse(body)[0]["url"]);
                    if(catCount <= 0){
                        resolve(catArray);
                    }
                }
            });
        };
    });
};

app.get("/errore", function(req, res){
    getCats(res).then(function(deezCats){
        res.render("errore", {catArray: deezCats});
    }).catch(function(error){
        console.log("Errore nella promessa di un gatto:");
        console.log(error);
        res.redirect("/");
    });
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
           log.error(err.toString());
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

io.use(passportSocketIo.authorize({
    cookieParser: cookieParser, //optional your cookie-parser middleware function. Defaults to require('cookie-parser')
    key: "connect.sid",       //make sure is the same as in your session settings in app.js
    secret: process.env.cooKey,      //make sure is the same as in your session settings in app.js
    store: mongoStore,        //you need to use the same sessionStore you defined in the app.use(session({... in app.js
    success: onAuthorizeSuccess,  // *optional* callback on success
    fail: onAuthorizeFail,     // *optional* callback on fail/error
}));

function onAuthorizeSuccess(data, accept){
    // console.log('Nuova connessione accettata, sessione: ' + data.sessionID);
    accept();
}

function onAuthorizeFail(data, message, error, accept){
    // error indicates whether the fail is due to an error or just a unauthorized client
    if(error)
    try {
        throw new Error(message);
    } catch(e) {
        console.log("\n*******************************\nSocket: ");
        console.log(data.sessionID);
        console.log(e);
        console.log("*******************************\n");
    }
    // send the (not-fatal) error-message to the client and deny the connection
    return accept(new Error(message));
  }

var ids = [];

var playerList = [];

var connessioni = playerList.length;

var turno = 0;

class Player {
    constructor(socket_id, id) {
        this.socket_id = socket_id;
        this.user_id = id;
        this.inGame = false;
    }
}

io.on("connection", function(socket){

    // Funzione per mandare un player in una pagina d'errore
    function sendToErrorPage(socket){
        socket.emit("redirect", "/errore");
    }

    // Ad ogni nuova connessione, controlla se il giocatore era già connesso
    function wasPlayerHere(socket){
        var found = " FINE RICERCA [NOT FOUND]\n\\========================/\n\n";
        console.log("\n/========================\\\n INIZIO RICERCA GIOCATORI\n");
        for(var i = 0; i < playerList.length; i++){
            if(playerList[i].user_id.toString() == socket.request.user._id.toString()){
                console.log("**************************\nID del giocatore trovato: " + playerList[i].user_id);
                console.log("che è uguale a");
                console.log("ID corrente: " + socket.request.user._id + "\n**************************\n");
                found = "  FINE RICERCA [SUCCESS]\n\\========================/\n\n";
                newConnection(playerList[i]);
                return 0;
            } else {
                console.log("**************************\nID del giocatore trovato: " + playerList[i].user_id);
                console.log("che è diverso da");
                // console.log("playerList[i].user_id");
                // console.log(typeof(playerList[i].user_id));
                // console.log("socket.request.user._id");
                // console.log(typeof(socket.request.user._id));
                console.log("ID corrente: " + socket.request.user._id + "\n**************************\n");
            }
        }
        // DEBUG
        // emitList();
        console.log(found);
        newConnection(false);
    }

    // Se sì, associa il nuovo socket al giocatore, altrimenti crea un nuovo oggetto Player
    function newConnection(foundPlayer){
        if(!foundPlayer){


            // Qua la logica per una nuova connessione da un nuovo player
            playerList.push(new Player(socket.id, socket.request.user._id));
            console.log("Trovato nuovo giocatore, aggiunto alla lista players.");
            // printPlayers();
            connessioni ++;
            ids.push(socket.id);
            socket.emit("id", {
                id: socket.id,
                giocatori: connessioni
            })

            if(connessioni <= 4){
                io.sockets.emit("nuovaConnessione", connessioni);
            }

            
        } else {
            foundPlayer.socket_id = socket.id;
            console.log("Giocatore riconnesso, lista players aggiornata.");
            // printPlayers();
        }
        // DEBUG
        // emitList();
    }

    // FOR DEBUG ONLY! REMOVE AFTER DEBUGGING.
    // setInterval(function(){
    //     socket.emit("playerlist", playerList);
    // }, 1000);
    // function emitList(){socket.emit("playerlist", playerList);};
    
    
    // Questa funzione ASYNC serve per stampare la lista dei giocatori
    async function printPlayers(){
        for(var i = 0; i < playerList.length; i++){
            await User.findById(playerList[i].user_id, function(err, foundPlayer){
                if(err){
                    Promise.resolve("Errore di mongoose nella ricerca del player:" + err);
                } else {
                    Promise.resolve(foundPlayer);
                }
            })
            .then(function(foundPlayer){
                console.log("\nGIOCATORE " + (i + 1) + ":");
                if(foundPlayer.nickname == ""){
                    console.log("Username: " + foundPlayer.username);
                } else {
                    console.log("Nickname: " + foundPlayer.nickname);
                };
                console.log("Socket ID: " + playerList[i].socket_id);
                console.log("User ID: " + playerList[i].user_id);
                console.log("inGame: " + playerList[i].inGame);
            }).catch(function(e){
                log.error("Errore nella ricerca username: " + e);
            });
        }
    }

    // Rimuove l'oggetto Player con il socket attuale
    function removePlayer(socket){
        for(var i = 0; i < playerList.length; i++){
            if(playerList[i].user_id == socket.request.user._id){
                if(!playerList[i].inGame){
                    connessioni--;
                    console.log("Il giocatore era in attesa, una connessione è stata sottratta.");
                }
                console.log("Rimosso il player " + playerList[i].user_id + " con socket ID " + socket.id);
                playerList.splice(i, 1);
                // printPlayers();
                return true;
            }
            // DEBUG
            // emitList();
        }
        return false;
    }

    wasPlayerHere(socket);

    var inGame = false;

    if(connessioni === 4){
        turno = 0;
        inGame = true;
        var mazzoTemp = [];
        var mazzo = require("./models/mazzo");
        var players = 4;
        log.warn("4 players hard coded in deck distribution. Remove after debugging.");
        // SET VAR players TO IDS.LENGTH AFTER DEBUGGING (remove 2 lines above and uncomment below)
        // var players = ids.length;
        var mazzoTemp = [];
        var playerCount = ids.length - 1;
        for (var mazzoCount = 0; mazzoCount < mazzo.length; mazzoCount++) {
            mazzoTemp.push(mazzo[mazzoCount]);
            if (mazzoCount + 1 == (ids.length - playerCount) * Math.floor(mazzo.length / ids.length)) {
                playerCount--;
                io.to(ids[playerCount + 1]).emit("carte", mazzoTemp);
                mazzoTemp = [];
            }
        };

        io.sockets.emit("connessioni", {
            id1: ids[0],
            id2: ids[1],
            id3: ids[2],
            id4: ids[3]
        });

        io.to(ids[turno]).emit("turno", turno);

    };
    console.log("\n******************\n" + connessioni + " player totali\n******************\n");

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
                log.warn("ATTENZIONE, numero turno invalido: " + turno);
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
            connessioni = 1;
            ids = [];
            console.log("Connessioni resettate a " + connessioni);
        }
    });

    socket.on("disconnect", function(){
        console.log("\nSocket " + socket.id + " disconnesso.");
        if(!removePlayer(socket)){
            log.error("Errore nella rimozione del socket " + socket.id);
            sendToErrorPage(socket);
            console.log("Socket rimosso da /dubito");
        };
    });
});

