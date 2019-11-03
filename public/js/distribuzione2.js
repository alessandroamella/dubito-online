var socket = io();

var inGame = false;

socket.on("connessioni", function(data){
    console.log("Gli id collegati sono:");
    console.log(data.id1);
    console.log(data.id2);
    console.log(data.id3);
    console.log(data.id4);
    setTimeout(function(){
        $("#infoMazzo").addClass("animated bounceOut");
    }, 1000);
    setTimeout(function(){
        $("#infoMazzo").remove();
    }, 2000);
    var inGame = true;
});

var userId;
var giocatore;

socket.on("id", function(data){
    $("#infoMazzo").html("Il tuo ID è <strong>" + data.id + "</strong>, sei il giocatore <strong>" + data.giocatori + "</strong> / 4, totale: <strong>" + data.giocatori + "</strong> / 4");
    userId = data.id;
    giocatore = data.giocatori;
});

socket.on("nuovaConnessione", function(data){
    console.log("Giocatori totali: " + data);
    $("#infoMazzo").html("Il tuo ID è <strong>" + userId + "</strong>, sei il giocatore <strong>" + giocatore + "</strong> / 4, totale: <strong>" + data + "</strong> / 4");
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

socket.on("carte", function(data){
    for(var i = 0; i < data.length; i++){
        var cartaRender = document.createElement("div");
        cartaRender.setAttribute('class', 'col-6 col-sm-5 col-md-3 col-xl-2');
        // console.log(data[i]);
        // cartaRender.innerHTML = '<button onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')"><strong>' + data[i].numero + '</strong> di <strong> ' + data[i].seme + '</strong></button>';
        var imageSource = "/imgs/" +  data[i].seme + "/" + data[i].numero + ".png";
        cartaRender.innerHTML = '<img onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')" src="' + imageSource + '" width="100px" class="m-3">';
        $("#mazzo").append(cartaRender);
        mazzo.push(new Carta(data[i].numero, data[i].seme));
    };
});


function cartaClick(numero, seme){
    console.log("Hai cliccato la carta " + numero + " di " + seme);
    socket.emit("cartaSend", {
        numero: numero,
        seme: seme
    })
};

socket.on("cartaReceive", function(data){
    console.log("Ricevuta la carta " + data.numero + " di " + data.seme);
});

var turnoAdesso = false;

socket.on("turno", function(data){
    if(data == giocatore - 1){
        console.log("È il tuo turno!");
    };
});

socket.on("noturno", function(data){
    console.log("Non è il tuo turno!");
});