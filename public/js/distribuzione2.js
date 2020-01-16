var socket = io();

var inGame = false;

setTimeout(function(){
    if($("#infoMazzo").text() == "Caricamento in corso... (Se non si carica, fai il logout e rientra)"){
        window.location.href = "/errore";
    }
}, 10000)

var partita_uuid = "";

socket.on("avversari", function(data){
    partita_uuid = data.partita_uuid;
    console.log("I tuoi avversari sono:");
    for(var i = 0; i < data.usernames.length; i++){
        console.log(data.usernames[i]);
    };
    setTimeout(function(){
        $("#infoMazzo").addClass("animated bounceOut");
    }, 1000);
    setTimeout(function(){
        $("#infoMazzo").remove();
    }, 2000);
    inGame = true;
});

var userId;
var giocatore;

socket.on("id", function(data){
    if(data.id.toString() == "undefined" && data.giocatori.toString() == "undefined"){
        window.location.href = "/errore";
    } else {
        $("#infoMazzo").html("Il tuo ID è <strong>" + data.id + "</strong>, sei il giocatore <strong>" + data.giocatori + "</strong> / 4, totale: <strong>" + data.giocatori + "</strong> / 4");
        userId = data.id;
        giocatore = data.giocatori;
    }
});

socket.on("aggiornaConnessioni", function(data){
    if(userId == "undefined" && giocatore == "undefined"){
        window.location.href = "/errore";
    } else {
        var posizione = giocatore;
        if(giocatore - data.connessioni > 0){
            posizione = giocatore - (giocatore - data.connessioni);
        } else {
            posizione = giocatore;
        }
        console.log("Giocatori totali: " + data.connessioni);
        $("#infoMazzo").html("Il tuo ID è <strong>" + userId + "</strong>, sei il giocatore <strong>" + posizione + "</strong> / 4, totale: <strong>" + data.connessioni + "</strong> / 4");
        $("#infoMazzo2").html("I tuoi avversari: <strong>" + data.usernames.join("</strong>, <strong>") + "</strong>");
    }
});

socket.on("errorone", function(data){
    alert(data);
});

$("#resetPlayers").click(function(event){
    console.log("Reset!");
    socket.emit("reset", {
        reset: true
    });
    location.reload();
});

class Carta {
    constructor(numero, seme) {
        this.numero = numero;
        this.seme = seme;
    }
}

var mazzo = [];
var mazzoDOM = $("#mazzo");

// !! REMOVE AFTER DEBUG!!
// socket.on("playerlist", function(playerList){
//     $("#debug").text("");
//     playerList.forEach(function(player){
//         var socket_id = player.socket_id;
//         var user_id = player.user_id;
//         $("#debug").text($("#debug").text() + "\n||| SOCKET = " + socket_id + " | USER ID = " + user_id);
//     });
// });

// Ordine di redirect
socket.on("redirect", function(destination){
    window.location.href = destination;
});

socket.on("carte", function(data){
    mazzo = [];
    mazzoDOM.empty();
    for(var i = 0; i < data.length; i++){
        var cartaRender = document.createElement("li");
        cartaRender.setAttribute('class', 'col-6 col-sm-5 col-md-3 col-xl-2');
        // console.log(data[i]);
        // cartaRender.innerHTML = '<button onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')"><strong>' + data[i].numero + '</strong> di <strong> ' + data[i].seme + '</strong></button>';
        var imageSource = "/imgs/" +  data[i].seme + "/" + data[i].numero + ".png";
        cartaRender.innerHTML = '<input type="checkbox" id="carta' + i + '"><label for="carta' + i + '"><img src="' + imageSource + '" onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')" width="100px" class="m-3"></label>';
        mazzoDOM.append(cartaRender);
        mazzo.push(new Carta(data[i].numero, data[i].seme));
    };
});


function cartaClick(numero, seme){
    console.log("Hai cliccato la carta " + numero + " di " + seme);
    if(inGame){
        socket.emit("cartaSend", {
            numero: numero,
            seme: seme
        })
    } else {
        console.log("Non sei in partita. Aspe, ma come fai a vedermi?!");
    }
};

socket.on("cartaReceive", function(data){
    console.log("Ricevuta la carta " + data.numero + " di " + data.seme);
});

var turnoAdesso = false;

socket.on("turno", function(data){
    console.log("È il tuo turno!");
});

socket.on("noturno", function(data){
    console.log("Non è il tuo turno!");
});

socket.on("senderSuccess", function(data){
    console.log(data);
});

socket.on("receiverSuccess", function(data){
    console.log(data);
});