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
    console.log(data);
    $("#infoMazzo").html("Il tuo ID è <strong>" + userId + "</strong>, sei il giocatore <strong>" + giocatore + "</strong> / 4, totale: <strong>" + data + "</strong> / 4");
});

$("#resetPlayers").click(function(event){
    console.log("Reset!");
    socket.emit("reset", {
        reset: true
    });
    location.reload();
});

function Carta(numero, seme){
    this.numero = numero;
    this.seme = seme;
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
    alert("Hai cliccato la carta " + numero + " di " + seme);
    console.log(mazzo);
};