var socket = io();

var inGame = false;

socket.on("connessioni", function(data){
    console.log("Gli id collegati sono:");
    console.log(data.id1);
    console.log(data.id2);
    console.log(data.id3);
    console.log(data.id4);
    var inGame = true;
});

socket.on("id", function(data){
    $("#infoMazzo").html("Il tuo ID è <strong>" + data.id + "</strong>, giocatori: <strong>" + data.giocatori + "</strong> / 4");
    var userId = data.id;
});

$("#resetPlayers").click(function(event){
    console.log("Reset!");
    socket.emit("reset", {
        reset: true
    });
    location.reload();
});

socket.on("carte", function(data){
    console.log(data);
});