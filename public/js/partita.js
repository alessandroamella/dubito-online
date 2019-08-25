var semi = ["bastoni", "denari", "coppe", "spade"];
var seme;

var carta1 = new Object();
carta1.obj = document.getElementById("carta1");
carta1.seme = semi[Math.floor(Math.random()*semi.length)];
carta1.carta = (Math.round(Math.random()*9) + 1);

carta1.obj.src = "/imgs/" + carta1.seme + "/" + carta1.carta + ".png";

var carta2 = new Object();
carta2.obj = document.getElementById("carta2");
carta2.seme = semi[Math.floor(Math.random()*semi.length)];
carta2.carta = (Math.round(Math.random()*9) + 1);

carta2.obj.src = "/imgs/" + carta2.seme + "/" + carta2.carta + ".png";

var carta3 = new Object();
carta3.obj = document.getElementById("carta3");
carta3.seme = semi[Math.floor(Math.random()*semi.length)];
carta3.carta = (Math.round(Math.random()*9) + 1);

carta3.obj.src = "/imgs/" + carta3.seme + "/" + carta3.carta + ".png";

var carta4 = new Object();
carta4.obj = document.getElementById("carta4");
carta4.seme = semi[Math.floor(Math.random()*semi.length)];
carta4.carta = (Math.round(Math.random()*9) + 1);

carta4.obj.src = "/imgs/" + carta4.seme + "/" + carta4.carta + ".png";

var carta5 = new Object();
carta5.obj = document.getElementById("carta5");
carta5.seme = semi[Math.floor(Math.random()*semi.length)];
carta5.carta = (Math.round(Math.random()*9) + 1);

carta5.obj.src = "/imgs/" + carta5.seme + "/" + carta5.carta + ".png";

var carta6 = new Object();
carta6.obj = document.getElementById("carta6");
carta6.seme = semi[Math.floor(Math.random()*semi.length)];
carta6.carta = (Math.round(Math.random()*9) + 1);

carta6.obj.src = "/imgs/" + carta6.seme + "/" + carta6.carta + ".png";

var carta7 = new Object();
carta7.obj = document.getElementById("carta7");
carta7.seme = semi[Math.floor(Math.random()*semi.length)];
carta7.carta = (Math.round(Math.random()*9) + 1);

carta7.obj.src = "/imgs/" + carta7.seme + "/" + carta7.carta + ".png";

var carta8 = new Object();
carta8.obj = document.getElementById("carta8");
carta8.seme = semi[Math.floor(Math.random()*semi.length)];
carta8.carta = (Math.round(Math.random()*9) + 1);

carta8.obj.src = "/imgs/" + carta8.seme + "/" + carta8.carta + ".png";

var carta9 = new Object();
carta9.obj = document.getElementById("carta9");
carta9.seme = semi[Math.floor(Math.random()*semi.length)];
carta9.carta = (Math.round(Math.random()*9) + 1);

carta9.obj.src = "/imgs/" + carta9.seme + "/" + carta9.carta + ".png";

var carta10 = new Object();
carta10.obj = document.getElementById("carta10");
carta10.seme = semi[Math.floor(Math.random()*semi.length)];
carta10.carta = (Math.round(Math.random()*9) + 1);

carta10.obj.src = "/imgs/" + carta10.seme + "/" + carta10.carta + ".png";

console.log(carta1);
console.log("La prima carta è un " + carta1.carta + " di " + carta1.seme);
