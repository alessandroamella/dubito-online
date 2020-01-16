var numeri = ["Asso", "2", "3", "4", "5", "6", "7", "Jack", "Donna", "Re"];
var semi = ["picche", "cuori", "quadri", "fiori"];
var mazzo = [];

function generaMazzo(){
	var mazzo = [];

	for(var i = 0; i < semi.length; i++){
		for(var x = 0; x < numeri.length; x++)
		{
			var card = {numero: numeri[x], seme: semi[i], index: i};
			mazzo.push(card);
		}
    }

    return mazzo;
}

function mescola(){
    
    for(var i = 0; i < mazzo.length; i++){
		var randomLocation = Math.floor((Math.random() * mazzo.length));
		var tmp = mazzo[i];

		mazzo[i] = mazzo[randomLocation];
		mazzo[randomLocation] = tmp;
    }
}

function carica()
{
	mazzo = generaMazzo();
	mescola();
}

carica();

module.exports = mazzo;