var socket = io();

var inGame = false;

var userId;
var giocatore;
var username;

setTimeout(function(){
    if($("#infoMazzo").text() == "Caricamento in corso... (Se non si carica, fai il logout e rientra)"){
        window.location.href = "/errore";
    }
}, 10000)

var partita_uuid = "";
var usernames = [];
var proprioTurno = 0;
var numTurno = 0;

socket.on("avversari", function(data){
    partita_uuid = data.partita_uuid;
    proprioTurno = data.turno;
    usernames = data.usernames;
    $("#partita-uuid").html("Partita <strong>" + partita_uuid.split("-")[0] + "</strong>").tooltip({title: partita_uuid, delay: {show: 0, hide: 3000}});;
    $("#infoMazzo2").html("<strong>" + data.usernames.join("</strong> > <strong>") + "</strong>");
    setTimeout(function(){
        $("#infoMazzo").addClass("animated bounceOut");
    }, 1000);
    setTimeout(function(){
        $("#infoMazzo").remove();
    }, 2000);
    inGame = true;
    displayTurno();
});

// $("#partita-uuid").toggle(function(){
//     $(this).text("Partita <strong>" + partita_uuid + "</strong>");
// }, function(){
//     $(this).text("Partita <strong>" + partita_uuid.split("-")[0] + "</strong>");
// });

socket.on("id", function(data){
    if(data.id.toString() == "undefined" && data.giocatori.toString() == "undefined"){
        window.location.href = "/errore";
    } else {
        $("#infoMazzo").html("Il tuo ID è <strong>" + data.id + "</strong>, sei il giocatore <strong>" + data.giocatori + "</strong> / 4, totale: <strong>" + data.giocatori + "</strong> / 4");
        userId = data.id;
        giocatore = data.giocatori;
        username = data.username;
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

        var usernames = data.usernames;
        for(var i = 0; i < usernames.length; i++){
            if(usernames[i] == username){
                usernames.splice(i, 1);
                break;
            }
        }
        $("#infoMazzo").html("Il tuo ID è <strong>" + userId + "</strong>, sei il giocatore <strong>" + posizione + "</strong> / 4, totale: <strong>" + data.connessioni + "</strong> / 4");
        $("#infoMazzo2").html("I tuoi avversari: <strong>" + usernames.join("</strong>, <strong>") + "</strong>");
    }
});

socket.on("errorone", function(data){
    alert(data);
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
        cartaRender.setAttribute('class', 'col-6 col-sm-4 col-md-3 col-lg-2');
        cartaRender.setAttribute('id', 'li-carta' + i);
        // console.log(data[i]);
        // cartaRender.innerHTML = '<button onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')"><strong>' + data[i].numero + '</strong> di <strong> ' + data[i].seme + '</strong></button>';
        var imageSource = "/imgs/" +  data[i].seme + "/" + data[i].numero + ".png";
        cartaRender.innerHTML = '<input type="checkbox" class="carta-checkbox" onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\', ' + i + ')" id="carta' + i + '"><label for="carta' + i + '"><img src="' + imageSource + '" width="100px" class="m-3"></label>';
        mazzoDOM.append(cartaRender);
        mazzo.push(new Carta(data[i].numero, data[i].seme));
    };
});

var numeroUguale;
var carteSelezionate = [];

function cartaClick(numero, seme, index){
    var carteBluffCount = 0;
    $.each($("input[class='carta-checkbox']:checked"), function(){
        carteBluffCount++;
        if(carteBluffCount > 3){
            $(this).prop("checked", false);
        }
    });
    if(proprioTurno == numTurno){
        var carteSelezionateTemp = []
        for(var i = 0; i < mazzo.length; i++){
            if(document.getElementById("carta" + i).checked){
                carteSelezionateTemp.push(mazzo[i]);
            }
        }
        carteSelezionate = carteSelezionateTemp;
        if(carteSelezionate.length > 0){
            $("#btn-bluffa").prop('disabled', false);
            numeroUguale = haSoloNumeriUguali(carteSelezionate);
            if(numeroUguale){
                // Numeri uguali
                $("#btn-invia").prop('disabled', false);
                $("#btn-invia").text('Invia come ' + numeroUguale);
            } else {
                // Numeri diversi
                $("#btn-invia").prop('disabled', true);
            };
        } else {
            $("#btn-invia").prop('disabled', true);
            $("#btn-bluffa").prop('disabled', true);
        }
    } else {
        $("#btn-invia").prop('disabled', true);
        $("#btn-bluffa").prop('disabled', true);
    }
}
function haSoloNumeriUguali(array) {
    for(var i = 0; i < array.length; i++){
        for(var j = 0; j < array.length; j++){
            if(i != j){
                if(array[i].numero != array[j].numero){
                    return false;
                }
            }
        }
    }
    return array[0].numero;
}

// $(".carta-checkbox").change(function(){
//     console.log($('.carta-checkbox:checked').size());
// });

$("#btn-invia").on("click", function(){
    socket.emit("cartaSend", {reali: carteSelezionate, nominale: numeroUguale});
});

var valoreRadio = "Asso";
$(".radio-bluff").change(function(){
    valoreRadio = $("input[name='numero-bluff-radio']:checked").attr("id").replace("numero-bluff-","");
});

$("#btn-bluffa-invia").on("click", function(){
    var carteBluffSelez = 0;
    socket.emit("cartaSend", {reali: carteSelezionate, nominale: valoreRadio})
});

var turnoAnimation = false;

socket.on("cartaSend", function(){
    for(var i = 0; i < mazzo.length; i++){
        document.getElementById("carta" + i).checked = false;
    }
    $("#btn-invia").prop('disabled', true);
    $("#btn-bluffa").prop('disabled', true);
    $('#bluffModal').modal('hide');
    turnoAnimation = false;
});

socket.on("cartaReceive", function(data){
    console.log("Ricevuti " + data.numCarte + " " + data.nominale + " da " + data.delPlayer);
});

socket.on("aggiornaTurno", function(data){
    numTurno = data;
    displayTurno();
});

function displayTurno(){
    var firstNames = [];
    var turnoName = "<span class='turnoPlayer'>" + usernames[numTurno] + "</span>";
    var secondNames = [];
    var combinedNames = [];
    for(var i = 0; i < numTurno; i++){
        firstNames.push(usernames[i]);
    }
    for(var i = numTurno + 1; i < usernames.length; i++){
        secondNames.push(usernames[i]);
    }
    if(firstNames.length > 0){
        combinedNames.push(firstNames.join(" > "));
    }
    combinedNames.push(turnoName);
    if(secondNames.length > 0){
        combinedNames.push(secondNames.join(" > "));
    }
    $("#infoMazzo2").html(combinedNames.join(" > "));
    if(proprioTurno == numTurno && !turnoAnimation){
        turnoText();
    }
}

socket.on("turno", function(){
    console.log("È il tuo turno!");
});

function turnoText(){
    turnoAnimation = true;
    function changeTextTimer(){
        setTimeout(function(){
            $("#infoMazzo2").html("<span class='turnoText'>È il tuo turno!</span>");
            setTimeout(function(){
                displayTurno();
                if(turnoAnimation){
                    changeTextTimer();
                } else {
                    displayTurno();
                }
            }, 1000);
        }, 1000);
    }
    changeTextTimer();
}

socket.on("noturno", function(data){
    console.log("Oh cosa usi, i cheat?! Non è il tuo turno!");
});