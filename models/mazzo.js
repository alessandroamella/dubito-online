var carte = ["Asso", "2", "3", "4", "5", "6", "7", "Jack", "Donna", "Re"];
var semi = ["picche", "cuori", "quadri", "fiori"];
var mazzo = new Array();

function generaMazzo(){
	var mazzo = new Array();

	for(var i = 0; i < semi.length; i++)
	{
		for(var x = 0; x < carte.length; x++)
		{
			var card = {numero: carte[x], seme: semi[i], index: i};
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

}

function carica()
{
	mazzo = generaMazzo();
	mescola();
}

carica();

module.exports = mazzo;