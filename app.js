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
const User = require("./models/user");
const Player = require("./models/player");
const Partita = require("./models/partita");
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
    ttl: 14 * 24 * 60 * 60
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

function getCats(res){
    var catCount = 5;
    var catArray = [];
    return new Promise(function (resolve, reject){
        for (var i = 0; i < 5; i++){
            request({
                url: 'https://api.thecatapi.com/v1/images/search',
                headers: {
                    'x-api-key': process.env.catKey
                }
            }, function(error, response, body){
                if(error){
                    log.error("Errore nella ricerca di un gatto:");
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
        log.error("Errore nella promessa di un gatto:");
        console.log(error);
        res.redirect("/");
    });
});

app.get("/rimosso", function(req, res){
    getCats(res).then(function(deezCats){
        res.render("rimosso", {catArray: deezCats});
    }).catch(function(error){
        log.error("Errore nella promessa di un gatto:");
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
    // Trova e aggiorna nickname, se valido
    if(req.body.nickname.length >= 5 && req.body.nickname.length <= 15 && /^\w+$/.test(req.body.nickname)){
        User.find({}, function(err, allUsers){
            if(err){
                log.error(err.toString());
                req.flash("error", err);
                res.redirect("/profilo");
            } else {
                var sameNick = false;
                for(var i = 0; i < allUsers.length; i++){
                    if(allUsers[i].nickname == req.body.nickname){
                        req.flash("error", "Il nickname " + req.body.nickname + " è già in uso");
                        res.redirect("/profilo");
                        sameNick = true;
                        break;
                    }
                }
                if(!sameNick){
                    User.findOneAndUpdate({_id: req.params.id}, {
                        nickname: req.body.nickname
                    }, function(err, updatedNick){
                       if(err){
                           log.error(err.toString());
                           req.flash("error", err);
                           res.redirect("/profilo");
                       } else {
                           // REDIRECT TO PROFILE
                           req.flash("success", "Salve, " + req.body.nickname + "!");
                           res.redirect("/profilo");
                       }
                    });
                }
            }
        });
    } else {
        req.flash("error", "Nickname invalido. Deve avere da 5 a 15 caratteri e può contenere solo lettere, numeri e trattini bassi!");
        res.redirect("/profilo");
    }
});

app.get("*", function(req, res){
    res.render("404");
});

var server = app.listen(process.env.PORT, process.env.IP, function (){
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
    } catch(e){
        console.log("\n*******************************\nSocket: ");
        console.log(data.sessionID);
        console.log(e);
        console.log("*******************************\n");
    }
    // send the (not-fatal) error-message to the client and deny the connection
    return accept(new Error(message));
}

// DEBUG / HARD CODE: Cambiando questa costante, cambia il numero di player in ogni partita
const numPlayers = 4;

var playerList = [];

var partite = [];

// var connessioni = playerList.length;

var turno = 0;

io.on("connection", function(socket){

    // Funzione per mandare un player in una pagina d'errore
    function sendToErrorPage(socket){
        socket.emit("redirect", "/errore");
    }

    // Ad ogni nuova connessione, controlla se il giocatore era già connesso in lista d'attesa
    function wasPlayerHere(socket){
        for(var i = 0; i < playerList.length; i++){
            if(playerList[i].user_id.toString() == socket.request.user._id.toString()){
                console.log("ID del giocatore trovato: " + playerList[i].user_id);
                newConnection(playerList[i], socket);
                return true;
            }
        }

        // Controlla se era in partita
        var inPartita = trovaPlayerInPartita(socket);
        if(inPartita){
            newConnection(partite[inPartita.partitaIndex].players[playerIndex], inPartita.socket);
            return true;
        };

        // DEBUG
        // emitList();
        newConnection(false, socket);
    }

    // Se sì, associa il nuovo socket al giocatore, altrimenti crea un nuovo oggetto Player
    function newConnection(foundPlayer, socket){
        
        // UNCOMMENT AFTER DEBUG
        // if(!foundPlayer){


            // Qua la logica per una nuova connessione da un nuovo player
            // playerList.push(new Player(socket));
            // var newPlayer = new Player(socket);
            console.log("Trovato nuovo giocatore, aggiunto alla lista players");
            // connessioni++;

            var newPlayer = emitNewConnection(socket, new Player(socket));

            playerList.push(newPlayer);
            emitInfo(socket, newPlayer.username);

            // printPlayers();
            
            console.log("\n******************");
            console.log(playerList.length + " player totali");
            console.log("******************\n");

            if(playerList.length === numPlayers){
                if(!iniziaPartita(playerList)){
                    playerList = [];
                    // connessioni = 0;
                    console.log("Connessioni resettate a " + playerList.length);
                };
            } else if(playerList.length > numPlayers){
                var morePlayers = [];
                for(var i = 0; i < playerList.length; i++){
                    if(!playerList[i].inGame){
                        morePlayers.push(playerList[i]);
                    }
                }
                if(morePlayers.length >= numPlayers){
                    iniziaPartita(morePlayers);
                }
            };


            
        // } else {
        //     foundPlayer.socket.id = socket.id;
        //     console.log("Giocatore riconnesso, lista players aggiornata");
        //     // printPlayers();
        // }

        // DEBUG
        // emitList();
    }

    wasPlayerHere(socket);

    // FOR DEBUG ONLY! REMOVE AFTER DEBUGGING.
    // setInterval(function(){
    //     socket.emit("playerlist", playerList);
    // }, 1000);
    // function emitList(){socket.emit("playerlist", playerList);};

    function emitInfo(socket, username){
        socket.emit("id", {
            id: socket.id,
            giocatori: playerList.length,
            username: username
        });
    }

    function emitNewConnection(socket, newPlayer){
        if(newPlayer.user_id == socket.request.user._id){
            if(socket.request.user.nickname == ""){
                newPlayer.username = socket.request.user.username;
            } else {
                newPlayer.username = socket.request.user.nickname;
            }
        } else {
            sendToErrorPage(socket);
        }

        // Chat room per player in attesa
        socket.join("waiting-room");

        io.to("waiting-room").emit("aggiornaConnessioni", {usernames: getUsernames(playerList), connessioni: playerList.length + 1});

        return newPlayer;

    }
    
    function printPlayers(){
        console.log("\n/========================\\\n  STAMPA LISTA GIOCATORI");
        for(var i = 0; i < playerList.length; i++){
            console.log("\n******************\nGIOCATORE " + (i + 1));
            console.log("Socket ID: " + playerList[i].socket.id);
            console.log("User ID: " + playerList[i].user_id);
            console.log("In Game: " + playerList[i].inGame);
            console.log("Username: " + playerList[i].username);
            console.log("******************");
        }
        console.log("\n FINE DELLA STAMPA PLAYER\n\\========================/\n\n");
    }

    // Questa funzione ASYNC serve per stampare la lista dei giocatori CERCANDO LO USERNAME
    async function printPlayersFindUsername(){
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
                console.log("Socket ID: " + playerList[i].socket.id);
                console.log("User ID: " + playerList[i].user_id);
                console.log("inGame: " + playerList[i].inGame);
            }).catch(function(e){
                log.error("Errore nella ricerca username: " + e);
            });
        }
    }

    function trovaPlayerInPartita(socket){
        for(var i = 0; i < partite.length; i++){
            for(var j = 0; j < partite[i].players.length; j++){
                if(partite[i].players[j].socket.id == socket.id){
                    return {
                        partitaIndex: i,
                        playerIndex: j,
                        socket: socket
                    };
                }
            }
        }
        return false;
    };

    // Rimuove l'oggetto Player con il socket attuale
    function removePlayer(socket){
        for(var i = 0; i < playerList.length; i++){
            if(playerList[i].user_id == socket.request.user._id){
                if(!playerList[i].inGame){
                    // connessioni--;
                    console.log("Il giocatore era in attesa, una connessione è stata sottratta");
                }
                socket.emit("redirect", "/rimosso");
                console.log("Rimosso il player " + playerList[i].user_id + " con socket ID " + socket.id);
                playerList.splice(i, 1);
                io.to("waiting-room").emit("aggiornaConnessioni", {usernames: getUsernames(playerList), connessioni: playerList.length});
                // printPlayers();
                return true;
            }
            // DEBUG
            // emitList();
        }
        var playerInPartita = trovaPlayerInPartita(socket);
        if(!playerInPartita){
            log.error("Errore nella rimozione del socket " + socket.id);
            sendToErrorPage(socket);
            console.log("Socket rimosso da /dubito");
            return false;
        } else {
            // Rimuovi giocatore dalla partita
            playerInPartita.socket.emit("redirect", "/rimosso");
            console.log("Rimosso il player " + partite[playerInPartita.partitaIndex].players[playerInPartita.playerIndex].username
            + " nella partita " + partite[playerInPartita.partitaIndex].partita_uuid);
            partite[playerInPartita.partitaIndex].players.splice(playerInPartita.playerIndex, 1);
            // DEBUG, DA CAMBIARE: annulla partita e manda all'attesa tutti gli altri player
            io.to(partite[playerInPartita.partitaIndex].partita_uuid).emit("redirect", "/dubito");
            partite.splice(partite[playerInPartita.partitaIndex], 1);
            return true;
        }
    }

    function getUsernames(players){
        var usernames = [];
        for(var i = 0; i < players.length; i++){
            usernames.push(players[i].username);
        }
        return usernames;
    }


    function iniziaPartita(Players){

        var playersLocal = Players.slice();

        var usernames = [];

        // Controlla che tutti i playersLocal non siano inGame
        var badGame = false;
        for(var i = 0; i < playersLocal.length; i++){
            if(playersLocal[i].inGame == true){
                // sendToErrorPage(socket) "manuale" perché non si ha il parametro socket
                playersLocal[i].socket.emit("redirect", "/errore");
                badGame = true;
            } else {
                playersLocal[i].inGame = true;
                for(var j = 0; j < playerList.length; j++){
                    if(playersLocal[i].socket.id == playerList[j].socket.id){
                        playerList.splice(j, 1);
                        j--;
                    }
                }
            }
        }
        // Se un player è già inGame, c'è un errore e badGame sarà true
        if(badGame){
            return false;
        }

        var nuovaPartita = new Partita(playersLocal);

        // Il turno va da 0 al numero di player - 1, come l'index dell'array playersLocal
        var mazzo = require("./models/mazzo");
        var mazzoTemp = [];
        var playerMinus = playersLocal.length - 1;
        for (var i = 0; i < mazzo.length; i++){
            mazzoTemp.push(mazzo[i]);
            if(i + 1 == (playersLocal.length - playerMinus) * Math.floor(mazzo.length / playersLocal.length)){
                // playerMinus = playersLocal.length -> 0, playerPlus = 0 -> playersLocal.length
                var playerPlus = playersLocal.length - 1 - playerMinus;
                nuovaPartita.players[playerPlus].mazzo = mazzoTemp;
                playersLocal[playerPlus].socket.emit("carte", mazzoTemp);

                playerMinus--;
                mazzoTemp = [];
            }
        };

        for(var i = 0; i < nuovaPartita.players.length; i++){
            // ATTENZIONE!! RICORDA CHE STAI INVIANDO LA PARTITA UUID
            nuovaPartita.players[i].socket.emit("avversari", {usernames: getUsernames(nuovaPartita.players), partita_uuid: nuovaPartita.partita_uuid, turno: i});
            nuovaPartita.players[i].socket.leave("waiting-room");
            nuovaPartita.players[i].socket.join(nuovaPartita.partita_uuid);
        }

        console.log("_____________________\n");
        console.log("Nuova partita creata con UUID " + nuovaPartita.partita_uuid);
        console.log("Giocatori: " + getUsernames(nuovaPartita.players).join(", "));
        console.log("_____________________\n");

        nuovaPartita.primoPlayer = nuovaPartita.turno;

        partite.push(nuovaPartita);

        nuovaPartita.players[nuovaPartita.primoPlayer].socket.emit("primoPlayer");

        return true;
    }

    function checkCarta(carte){
        var numeri = ["Asso", "2", "3", "4", "5", "6", "7", "Jack", "Donna", "Re"];
        var semi = ["picche", "cuori", "quadri", "fiori"];
        // Per tutte le carte date, controlla:
        for(var i = 0; i < carte.reali.length; i++){
            var numeroValido = false;
            var semeValido = false;
            // Che il numero sia valido
            for(var j = 0; j < numeri.length; j++){
                if(carte.reali[i].numero == numeri[j]){
                    numeroValido = true;
                    break;
                }
            }
            // Che il seme sia valido
            for(var j = 0; j < semi.length; j++){
                if(carte.reali[i].seme == semi[j]){
                    semeValido = true;
                    break;
                }
            }
        }
        if(numeroValido && semeValido){
            // Se sono entrambi validi, controlla il valore nominale
            for(var i = 0; i < numeri.length; i++){
                if(carte.nominale == numeri[i]){
                    return true;
                }
            }
        }
        return false;
    }

    function checkMazzoAndTaglia(partita, carte, player){
        if(carte.reali.length > 3){
            return false;
        }
        var cartaTot = 0;
        var playerMazzo = partita.players[player.playerIndex].mazzo;
        for(var i = 0; i < playerMazzo.length; i++){
            for(var j = 0; j < carte.reali.length; j++){
                try {
                    if(playerMazzo[i].numero == carte.reali[j].numero && playerMazzo[i].seme == carte.reali[j].seme){
                        cartaTot++;
                        playerMazzo.splice(i, 1);
                        if(i > 0){
                            i--;
                        }
                    }
                }
                catch(err) {
                    console.log("\n\n\n");
                    console.log("Errore nella funzione checkMazzoAndTaglia");
                    console.log(err);
                    console.log("\n\n\n\n\nplayerMazzo:");
                    console.log(playerMazzo.length);
                    console.log(playerMazzo);
                    console.log("i");
                    console.log(i);
                    console.log("carte.reali:");
                    console.log(carte.reali.length);
                    console.log(carte.reali);
                    console.log("j");
                    console.log(j);
                    console.log("\n\n\n");
                }
            }
        }
        if(cartaTot == carte.reali.length){
            if(checkCarta(carte)){
                return playerMazzo;
            }
        }
        return false;
    }

    function checkNominale(carteInMezzo, nominale){
        // Se il num. dell'ultima carta in mezzo = quella scartata, allora si può continuare
        if(carteInMezzo[carteInMezzo.length - 1].nominale == nominale){
            return true;
        }
        return false;
    }

    socket.on("cartaSend", function(carte){
        var playerInPartita = trovaPlayerInPartita(socket);
        if(!playerInPartita){
            console.log("Riga 599, giocatore rimosso.")
            removePlayer(socket);
        } else {
            var partitaIndex = playerInPartita.partitaIndex;
            var playerIndex = playerInPartita.playerIndex;
            var partita = partite[partitaIndex];
            var okMazzoTagliato = checkMazzoAndTaglia(partita, carte, playerInPartita);
            if(!okMazzoTagliato){
                console.log("Riga 606, giocatore rimosso.")
                removePlayer(socket);
            } else {
                // CONTROLLA TURNO
                if(partita.turno == playerIndex){

                    // CONTROLLA SE È PRIMO PLAYER
                    if(partita.primoPlayer == partita.turno || checkNominale(partita.carteInMezzo, carte.nominale)){
                        partita.primoPlayer = -1;

                        socket.emit("cartaSend", okMazzoTagliato);
                        partita.carteInMezzo.push({
                            carte: carte.reali,
                            nominale: carte.nominale,
                            delPlayer: partita.players[partita.turno],
                        });
                        // Solo se è il turno del socket che emette la carta, allora emetti a tutti la carta inviata
                        io.to(partita.partita_uuid).emit("cartaReceive", {
                            numCarte: carte.reali.length,
                            nominale: carte.nominale,
                            delPlayer: partita.players[partita.turno].username
                        });
                    } else {
                        console.log("Riga 629, giocatore rimosso.")
                        removePlayer(partita.players[playerIndex].socket);
                    }
                    var turnoBefore = partita.turno - 1;
                    if(turnoBefore < 0){turnoBefore = partita.players.length - 1;}
                    if(partita.players[turnoBefore].mazzo.length <= 0){
                        vittoria(partita, partita.turno);
                    }
                    // Aumenta il turno di uno, se il turno è pari al numero del giocatori totali, allora il giro ricomincia
                    aumentaTurno(partita);
                    partita.players[partita.turno].socket.emit("turno");
                    io.to(partita.players[partita.turno]).emit("turno", partita.turno);
                    io.to(partita.partita_uuid).emit("aggiornaTurno", partita.turno);

                } else {
                    // Se non è il turno del socket che emette la carta, allora emetti "noturno"
                    socket.emit("noturno", true);
                };
            }
        }

    });

    function aumentaTurno(partita){
        if(partita.turno >= 0 && partita.turno.toString() < (partita.players.length - 1).toString()){
            partita.turno++;
        } else if(partita.turno >= partita.players.length - 1){
            partita.turno = 0;
        } else {
            log.warn("ATTENZIONE, numero turno invalido: " + partita.turno);
            partita.turno = 0;
        };
    }

    socket.on("dubito", function(){
        var playerInPartita = trovaPlayerInPartita(socket);
        if(!playerInPartita){
            console.log("Riga 657, giocatore rimosso.")
            removePlayer(socket);
        } else {
            var partitaIndex = playerInPartita.partitaIndex;
            var playerIndex = playerInPartita.playerIndex;
            var partita = partite[partitaIndex];
            if(partita.turno == playerIndex){
                // CONTROLLA SE È PRIMO PLAYER
                if(partita.primoPlayer != playerIndex){
                    var indexEmit = partita.turno - 1;
                    if(indexEmit < 0){indexEmit = partita.players.length - 1;}
                    if(dubito(partita)){
                        console.log("Il giocatore ha dubitato correttamente!");
                        for(var i = 0; i < partita.carteInMezzo.length; i++){
                            for(var j = 0; j < partita.carteInMezzo[i].carte.length; j++){
                                partita.players[indexEmit].mazzo.push(partita.carteInMezzo[i].carte[j]);
                            }
                        }
                        io.to(partita.partita_uuid).emit("afterDubito", {username: partita.players[partita.turno].username, esito: true, pastUsername: partita.players[indexEmit].username})
                        partita.primoPlayer = partita.turno;
                        partita.players[indexEmit].socket.emit("carte", partita.players[indexEmit].mazzo);
                        partita.carteInMezzo = [];
                        io.to(partita.partita_uuid).emit("aggiornaTurno", partita.turno);
                        socket.emit("primoPlayer");
                    } else {
                        console.log("Il giocatore ha dubitato errato!");
                        for(var i = 0; i < partita.carteInMezzo.length; i++){
                            for(var j = 0; j < partita.carteInMezzo[i].carte.length; j++){
                                partita.players[partita.turno].mazzo.push(partita.carteInMezzo[i].carte[j]);
                            }
                        }
                        io.to(partita.partita_uuid).emit("afterDubito", {username: partita.players[partita.turno].username, esito: false, pastUsername: partita.players[indexEmit].username})
                        partita.players[partita.turno].socket.emit("carte", partita.players[partita.turno].mazzo);
                        partita.carteInMezzo = [];
                        aumentaTurno(partita);
                        partita.primoPlayer = partita.turno;
                        io.to(partita.partita_uuid).emit("aggiornaTurno", partita.turno);
                        partita.players[partita.turno].socket.emit("primoPlayer");
                    };
                    if(partita.players[indexEmit].mazzo.length <= 0){
                        vittoria(partita, partita.turno);
                    }
                } else {
                    // Il giocatore è il primo player
                    console.log("Riga 686, giocatore rimosso.")
                    removePlayer(socket);
                }
            } else {
                socket.emit("noturno", true);
            };
        }
    });

    function dubito(partita){
        var carteInMezzo = partita.carteInMezzo[partita.carteInMezzo.length - 1];
        for(var i = 0; i < carteInMezzo.carte.length; i++){
            if(carteInMezzo.carte[i].numero != carteInMezzo.nominale){
                // Il giocatore ha dubitato correttamente
                return true;
            }
        }
        return false;
    }

    function vittoria(partita, playerIndex){
        io.to(partita.partita_uuid).emit("vittoriaTimer");
        setTimeout(function(){
            // !! Aumenta stats vincitore!!
            var podio = [];
            for(var i = 0; i < partita.players.length; i++){
                podio.push({
                    username: partita.players[i].username,
                    carteRimanenti: partita.players[i].mazzo.length
                });
            }
            podio.sort((a, b) => (a.carteRimanenti > b.carteRimanenti) ? 1 : -1)
            io.to(partita.partita_uuid).emit("vittoria", {
                username: partita.players[playerIndex].username,
                podio: podio
            });
            for(var i = 0; i < partite.length; i++){
                if(partite[i].partita_uuid == partita.partita_uuid){
                    partite.splice(i, 1);
                    return true;
                }
            }
            return false;
        }, 2500)
    };

    // Tasto di debug per impostare a 0 il numero di socket connessi
    socket.on("reset", function(){
        if(socket.request.user.googleId == process.env.googleId){
            playerList = [];
            // connessioni = 0;
            console.log("Connessioni resettate a " + playerList.length);
        }
    });

    socket.on("disconnect", function(){
        console.log("\nSocket " + socket.id + " disconnesso");
        console.log("Riga 706, giocatore rimosso.")
        removePlayer(socket);
    });
});

