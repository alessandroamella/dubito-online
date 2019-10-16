// CREA MAZZO E MESCOLA CARTE

var carte = ["Asso", "2", "3", "4", "5", "6", "7", "Fante", "Cavallo", "Re"];
var semi = ["bastoni", "coppe", "denari", "spade"];
var mazzo = new Array();

function prendiMazzo()
{
	var mazzo = new Array();

	for(var i = 0; i < semi.length; i++)
	{
		for(var x = 0; x < carte.length; x++)
		{
			var card = {Valore: carte[x], Seme: semi[i]};
			mazzo.push(card);
		}
	}

	return mazzo;
}

function mescola()
{
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

	renderizzaMazzo();
}

function renderizzaMazzo()
{
	document.getElementById('mazzo').innerHTML = '';

	for(var i = 0; i < mazzo.length; i++)
	{
		var card = document.createElement("div");
		var seme = '';
		if (mazzo[i].Seme == 'coppe')
		seme=' di coppe';
		else if (mazzo[i].Seme == 'denari')
		seme = ' di denari';
		else if (mazzo[i].Seme == 'bastoni')
		seme = ' di bastoni';
		else
		seme = ' di spade';

		card.innerHTML = mazzo[i].Valore + '' + seme;
		card.className = 'card col-12 col-md-6 col-xl-4';
        document.getElementById("mazzo").appendChild(card);
        // $("#mazzo").append('<div class="col-12 col-md-6 col-xl-4">' + card + '</div>');
        console.log(card);
	}
}

function carica()
{
	mazzo = prendiMazzo();
	mescola();
	renderizzaMazzo();
}

// window.onload = carica;

var inGame = false;

var socket = io();

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

// socket.on("disponibile", function(){
//     // Do something while less than 4 players
// });

$("#resetPlayers").click(function(event){
    console.log("Reset!");
    socket.emit("reset", {
        reset: true
    });
    location.reload();
});

// !! FUNZIONE RENDERIZZAMAZZO():
// Fai in modo che ogni carta abbia in <div> con la proprietà class="column" (<- aggiungi Flexbox), e racchiudile tutte in un <div> con classe d-flex