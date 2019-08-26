var cards = ["Asso", "2", "3", "4", "5", "6", "7", "Fante", "Cavallo", "Re"];
var suits = ["bastoni", "coppe", "denari", "spade"];
var deck = new Array();

function prendiMazzo()
{
	var deck = new Array();

	for(var i = 0; i < suits.length; i++)
	{
		for(var x = 0; x < cards.length; x++)
		{
			var card = {Value: cards[x], Suit: suits[i]};
			deck.push(card);
		}
	}

	return deck;
}

function mescola()
{
	// for 1000 turns
	// switch the values of two random cards
	for (var i = 0; i < 1000; i++)
	{
		var location1 = Math.floor((Math.random() * deck.length));
		var location2 = Math.floor((Math.random() * deck.length));
		var tmp = deck[location1];

		deck[location1] = deck[location2];
		deck[location2] = tmp;
	}

	renderizzaMazzo();
}

function renderizzaMazzo()
{
	document.getElementById('deck').innerHTML = '';

	for(var i = 0; i < deck.length; i++)
	{
		var card = document.createElement("div");
		var icon = '';
		if (deck[i].Suit == 'coppe')
		icon=' di coppe';
		else if (deck[i].Suit == 'denari')
		icon = ' di denari';
		else if (deck[i].Suit == 'bastoni')
		icon = ' di bastoni';
		else
		icon = ' di spade';

		card.innerHTML = deck[i].Value + '' + icon;
		card.className = 'card';
		document.getElementById("deck").appendChild(card);
	}
}

function carica()
{
	deck = prendiMazzo();
	mescola();
	renderizzaMazzo();
}

window.onload = carica;