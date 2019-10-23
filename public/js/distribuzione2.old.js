var carte = ["Asso", "2", "3", "4", "5", "6", "7", "Fante", "Cavallo", "Re"];
var semi = ["bastoni", "coppe", "denari", "spade"];
var mazzo = new Array();

function generaMazzo(){
	var mazzo = new Array();

	for(var i = 0; i < semi.length; i++)
	{
		for(var x = 0; x < carte.length; x++)
		{
			var card = {numero: carte[x], seme: semi[i]};
			mazzo.push(card);
		}
	}

	return mazzo;
}

function mescola(){
	// for 1000 turns
	// switch the values of two random cards
	for (var i = 0; i < 1000; i++)
	{
		var location1 = Math.floor((Math.random() * mazzo.length));
		var location2 = Math.floor((Math.random() * mazzo.length));
		var tmp = mazzo[location1];

		mazzo[location1] = mazzo[location2];
		mazzo[location2] = tmp;
	}

	distribuisci();
}

var socket = io();

var inGame = false;

socket.on("connessioni", function(data){
    console.log("Gli id collegati sono:");
    console.log(data.id1);
    console.log(data.id2);
    console.log(data.id3);
    console.log(data.id4);
    var inGame = true;
    carica();
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

function distribuisci(){
    socket.emit("mazzo", mazzo);
    console.log(mazzo);
};

function carica()
{
	mazzo = generaMazzo();
	mescola();
}