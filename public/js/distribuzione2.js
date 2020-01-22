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
var turnoAttuale = 0;
var primoPlayer = false;
var nominale = false;

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
    constructor(numero, seme){
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
        cartaRender.innerHTML = '<input type="checkbox" class="carta-checkbox" onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')" id="carta' + i + '"><label for="carta' + i + '"><img src="' + imageSource + '" width="100px" class="m-3"></label>';
        mazzoDOM.append(cartaRender);
        mazzo.push(new Carta(data[i].numero, data[i].seme));
    };
});

var numeroUguale;
var carteSelezionate = [];

function cartaClick(numero, seme){
    var carteBluffCount = 0;
    $.each($("input[class='carta-checkbox']:checked"), function (){
        carteBluffCount++;
        if(carteBluffCount > 3){
            $(this).prop("checked", false);
        }
    });
    if(proprioTurno == turnoAttuale){

        var carteSelezionateTemp = []
        for(var i = 0; i < mazzo.length; i++){
            if(document.getElementById("carta" + i).checked){
                carteSelezionateTemp.push(mazzo[i]);
            }
        }
        carteSelezionate = carteSelezionateTemp;

        if(carteSelezionate.length > 0){
            if(primoPlayer){
                $("#btn-bluffa").html('<i class="fas fa-arrow-alt-circle-right"></i> Bluffa \u00bb').prop('disabled', false);
                numeroUguale = haSoloNumeriUguali(carteSelezionate);
                if(numeroUguale){
                    // Numeri uguali
                    $("#btn-invia").prop('disabled', false).html('<i class="far fa-arrow-alt-circle-right"></i> Invia come ' + numeroUguale + " \u00bb");
                } else {
                    // Numeri diversi
                    $("#btn-invia").prop('disabled', true);
                };
            } else {

                var carteSelezionateTemp = []
                for(var i = 0; i < mazzo.length; i++){
                    if(document.getElementById("carta" + i).checked){
                        carteSelezionateTemp.push(mazzo[i]);
                    }
                }
                carteSelezionate = carteSelezionateTemp;

                var carteBuone = true;
                for(var i = 0; i < carteSelezionate.length; i++){
                    if(carteSelezionate[i].numero != nominale){
                        carteBuone = false;
                        break;
                    }
                }
                if(carteBuone == true){
                    $("#btn-invia").prop('disabled', false).html('<i class="far fa-arrow-alt-circle-right"></i> Invia come ' + nominale + " \u00bb");
                    $("#btn-bluffa").prop('disabled', true).html('<i class="fas fa-arrow-alt-circle-right"></i> Bluffa');
                } else {
                    $("#btn-invia").prop('disabled', true);
                    $("#btn-bluffa").prop('disabled', false).html('<i class="fas fa-arrow-alt-circle-right"></i> Bluffa \u00bb');
                }

                // // LOGICA SE IL PLAYER NON È IL PRIMO
                // if(numero == nominale){
                //     // Se numero = nominale, puoi anche non bluffare
                //     var carteSelezionateTemp = []
                //     for(var i = 0; i < mazzo.length; i++){
                //         if(document.getElementById("carta" + i).checked){
                //             carteSelezionateTemp.push(mazzo[i]);
                //         }
                //     }
                //     carteSelezionate = carteSelezionateTemp;
                //     if(carteSelezionate.length > 0){
                //         numeroUguale = haSoloNumeriUguali(carteSelezionate);
                //         if(numeroUguale){
                //             // Numeri uguali
                //             var couldBluff = false;
                //             for(var i = 0; i < carteSelezionate.length; i++){
                //                 if(carteSelezionate[i].numero != nominale){
                //                     $("#btn-invia").prop('disabled', true);
                //                     couldBluff = true;
                //                     break;
                //                 }
                //             }
                //             if(!couldBluff){
                //                 $("#btn-invia").prop('disabled', false);
                //                 $("#btn-invia").text('Invia come ' + nominale + " \u00bb");
                //                 $("#btn-bluffa").prop('disabled', true);
                //             }
                //         } else {
                //             // Numeri diversi
                //             $("#btn-invia").prop('disabled', true);
                //             $("#btn-bluffa").prop('disabled', false);
                //         };
                //     } else {
                //         $("#btn-invia").prop('disabled', true);
                //         $("#btn-bluffa").prop('disabled', true);
                //     }
                // } else {
                //     var ricontrollo = true;
                //     for(var i = 0; i < carteSelezionate.length; i++){
                //         if(carteSelezionate[i].numero != nominale){
                //             ricontrollo = false;
                //             break;
                //         }
                //     }
                //     if(ricontrollo){
                //         $("#btn-invia").prop('disabled', false);
                //         $("#btn-bluffa").prop('disabled', true);
                //     } else {
                //         $("#btn-invia").prop('disabled', true);
                //         $("#btn-bluffa").prop('disabled', false);
                //     }
                //     var carteSelezionateTemp = []
                //     for(var i = 0; i < mazzo.length; i++){
                //         if(document.getElementById("carta" + i).checked){
                //             carteSelezionateTemp.push(mazzo[i]);
                //         }
                //     }
                //     carteSelezionate = carteSelezionateTemp;
                // }

                // if(carteSelezionate.length > 0){
                //     for(var i = 0; i < carteSelezionate.length; i++){
                //         if(carteSelezionate[i].numero != nominale){
                //             $("#btn-bluffa").prop('disabled', false).text("Bluffa \u00bb");
                //             break;
                //         }
                //     }
                // } else {
                //     $("#btn-bluffa").prop('disabled', true);
                // }

            }
        } else {
            $("#btn-invia").prop('disabled', true);
            $("#btn-bluffa").prop('disabled', true);
        }
    }
}
function haSoloNumeriUguali(array){
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
    $("#btn-invia").prop('disabled', true);
    $("#btn-bluffa").prop('disabled', true);
    if(primoPlayer){
        socket.emit("cartaSend", {reali: carteSelezionate, nominale: numeroUguale});
    } else {
        socket.emit("cartaSend", {reali: carteSelezionate, nominale: nominale});
    }
});

var valoreRadio = "Asso";
$(".radio-bluff").change(function(){
    valoreRadio = $("input[name='numero-bluff-radio']:checked").attr("id").replace("numero-bluff-","");
});

$("#btn-bluffa-invia").on("click", function(){
    socket.emit("cartaSend", {reali: carteSelezionate, nominale: valoreRadio})
});

var turnoAnimation = false;

socket.on("cartaSend", function(nuovoMazzo){
    for(var i = 0; i < mazzo.length; i++){
        document.getElementById("carta" + i).checked = false;
    }
    $("#btn-invia").prop('disabled', true);
    $("#btn-bluffa").prop('disabled', true);
    $('#bluffModal').modal('hide');
    primoPlayer = false;
    turnoAnimation = false;
    
    mazzo = [];
    mazzoDOM.empty();
    for(var i = 0; i < nuovoMazzo.length; i++){
        var cartaRender = document.createElement("li");
        cartaRender.setAttribute('class', 'col-6 col-sm-4 col-md-3 col-lg-2');
        cartaRender.setAttribute('id', 'li-carta' + i);
        // console.log(nuovoMazzo[i]);
        // cartaRender.innerHTML = '<button onclick="cartaClick(\'' + nuovoMazzo[i].numero + '\', \'' + nuovoMazzo[i].seme + '\')"><strong>' + nuovoMazzo[i].numero + '</strong> di <strong> ' + nuovoMazzo[i].seme + '</strong></button>';
        var imageSource = "/imgs/" +  nuovoMazzo[i].seme + "/" + nuovoMazzo[i].numero + ".png";
        cartaRender.innerHTML = '<input type="checkbox" class="carta-checkbox" onclick="cartaClick(\'' + nuovoMazzo[i].numero + '\', \'' + nuovoMazzo[i].seme + '\')" id="carta' + i + '"><label for="carta' + i + '"><img src="' + imageSource + '" width="100px" class="m-3"></label>';
        mazzoDOM.append(cartaRender);
        mazzo.push(new Carta(nuovoMazzo[i].numero, nuovoMazzo[i].seme));
    };
});

socket.on("cartaReceive", function(data){
    $("#avvenimenti").html("<strong>" + data.delPlayer + "</strong> ha inviato " + data.numCarte + ' "<strong>' + data.nominale + '</strong>"');
    console.log("Ricevuti " + data.numCarte + " " + data.nominale + " da " + data.delPlayer);
    $("#btn-invia").html('<i class="far fa-arrow-alt-circle-right"></i> Invia come ' + data.nominale);
    $("#btn-bluffa").html('<i class="fas fa-arrow-alt-circle-right"></i> Bluffa');
    nominale = data.nominale;
});

function aggiornaBtnDubito(){
    if(primoPlayer){
        $("#btn-dubito").prop('disabled', true);
    } else {
        if(turnoAttuale == proprioTurno){
            $("#btn-dubito").prop('disabled', false);
        } else {
            $("#btn-dubito").prop('disabled', true);
        }
    }
}

socket.on("aggiornaTurno", function(data){
    turnoAttuale = data;
    aggiornaBtnDubito();
    displayTurno();
});

function displayTurno(){
    var firstNames = [];
    var turnoName = "<span class='turnoPlayer'>" + usernames[turnoAttuale] + "</span>";
    var secondNames = [];
    var combinedNames = [];
    for(var i = 0; i < turnoAttuale; i++){
        firstNames.push(usernames[i]);
    }
    for(var i = turnoAttuale + 1; i < usernames.length; i++){
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
    if(proprioTurno == turnoAttuale && !turnoAnimation){
        turnoText();
    } else {
        turnoAnimation = false;
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

// CONTROLLA DUBITO, IMPOSTA DISABLED E TUTTO IL RESTO
$("#btn-dubito").on("click", function(){
    if(proprioTurno == turnoAttuale){
        if(!primoPlayer){
            socket.emit("dubito");
        } else {
            console.log("Sei il primo player, non puoi dubitare!");
        }
    } else {
        console.log("Oh cosa usi, i cheat?! Non è il tuo turno!");
    }
});

socket.on("primoPlayer", function(){
    primoPlayer = true;
    aggiornaBtnDubito();
});

$("#btn-bluffa").on("click", function(){
    if(turnoAttuale == proprioTurno && primoPlayer){
        $('#bluffModal').modal('show');
    } else if(turnoAttuale == proprioTurno && !primoPlayer){
        socket.emit("cartaSend", {reali: carteSelezionate, nominale: nominale})
    } else {
        if(window.confirm("Non dovresti vedere questo messaggio. Se non sei sicuro di quel che stai facendo, annulla o rischi il ban.")){ 
            $('#bluffModal').modal('show');
        }
    };
});

// socket.on("addCarte", function(data){
//     mazzo = [];
//     mazzoDOM.empty();
//     for(var i = 0; i < data.length; i++){
//         var cartaRender = document.createElement("li");
//         cartaRender.setAttribute('class', 'col-6 col-sm-4 col-md-3 col-lg-2');
//         cartaRender.setAttribute('id', 'li-carta' + i);
//         // console.log(data[i]);
//         // cartaRender.innerHTML = '<button onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')"><strong>' + data[i].numero + '</strong> di <strong> ' + data[i].seme + '</strong></button>';
//         var imageSource = "/imgs/" +  data[i].seme + "/" + data[i].numero + ".png";
//         cartaRender.innerHTML = '<input type="checkbox" class="carta-checkbox" onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')" id="carta' + i + '"><label for="carta' + i + '"><img src="' + imageSource + '" width="100px" class="m-3"></label>';
//         mazzoDOM.append(cartaRender);
//         mazzo.push(new Carta(data[i].numero, data[i].seme));
//     };
//     // for(var i = 0; i < data.length; i++){
//     //     var cartaRender = document.createElement("li");
//     //     cartaRender.setAttribute('class', 'col-6 col-sm-4 col-md-3 col-lg-2');
//     //     cartaRender.setAttribute('id', 'li-carta' + mazzo.length);
//     //     // console.log(data[i]);
//     //     // cartaRender.innerHTML = '<button onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')"><strong>' + data[i].numero + '</strong> di <strong> ' + data[i].seme + '</strong></button>';
//     //     var imageSource = "/imgs/" +  data[i].seme + "/" + data[i].numero + ".png";
//     //     cartaRender.innerHTML = '<input type="checkbox" class="carta-checkbox" onclick="cartaClick(\'' + data[i].numero + '\', \'' + data[i].seme + '\')" id="carta' + mazzo.length + '"><label for="carta' + mazzo.length + '"><img src="' + imageSource + '" width="100px" class="m-3"></label>';
//     //     mazzoDOM.append(cartaRender);
//     //     console.log("Aggiunta una nuova carta al mazzo con i = " + i + ", " + data[i].numero + data[i].seme);
//     //     mazzo.push(new Carta(data[i].numero, data[i].seme));
//     // };
// })

socket.on("afterDubito", function(data){
    if(data.esito){
        $("#avvenimenti").html("<strong>" + data.username + "</strong> ha dubitato <span style='color: green;'>correttamente</span> le carte di <strong>" + data.pastUsername + "</strong>!");
    } else {
        $("#avvenimenti").html("<strong>" + data.username + "</strong> ha dubitato <span style='color: red;'>erroneamente</span> le carte di <strong>" + data.pastUsername + "</strong>!");
    }
});

function coloreCasuale(){
    return "hsl(" + (Math.random() * (360 / Math.random()) % 360) + ",100%,50%)";
}

socket.on("vittoria", function(data){
    var podioText = "";
    for(var i = 0; i < data.podio.length; i++){
        podioText += ("<p style='font-size: 1.2rem'><strong>" + (i + 1) + "</strong>: <strong>" + data.podio[i].username + "</strong> con <strong>" + data.podio[i].carteRimanenti + "</strong> carte rimanenti</p>");
    }
    $("#btns-nav").remove();
    $(".mazzo").html("<h1 id='vittoria-text' style='color: " + coloreCasuale() + ";'>" + data.username + " ha vinto!</h1>")
        .append("<h1>Il podio:</h1>" + podioText + '<button onclick="location.href=' + "'/dubito'" + ';" class="tasto-rosa"><i class="fa fa-repeat" aria-hidden="true"></i> Nuova partita</button>');
});

socket.on("perdita", function(){
    $("#partita-container").empty();
});

socket.on("vittoriaTimer", function(){
    $("#btn-invia").prop('disabled', true);
    $("#btn-bluffa").prop('disabled', true);
    $("#btn-dubito").prop('disabled', true);
})