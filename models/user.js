var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username: { type: String, default: 'default' },
    googleId: { type: String, default: 'default' },
    thumbnail: { type: String, default: 'default' },
    nickname: { type: String, default: 'default' },
    email: { type: String, default: 'default' },
    stats: {
        rank: [{
            nome: { type: String, default: 'Principiante' }
        }],
        punti: { type: Number, default: 0 },
        dataCreazione: { type: Date, default: Date.now },
        partiteGiocate: [{
            nome: { type: String, default: 'default' },
            partita_uuid: { type: String, default: 'default' },
            players: [{
                username: { type: String, default: 'default' },
                thumbnail: { type: String, default: 'default' },
                rank: { type: String, default: 'default' },
                punti: { type: Number, default: 0 },
                dataCreazione: { type: Date, default: Date.now }
            }],
            giocate: { type: Number, default: 0 },
            vincitore_num: { type: Number, default: 0 }
        }],
        vittorie: { type: Number, default: 0 },
        sconfitte: { type: Number, default: 0 },
        vittorieConsecutive: { type: Number, default: 0 },
        warns: [{

        }],
        carteGiocate: { type: Number, default: 0 },
        obiettivi: [{
            nome: { type: String, default: '/imgs/favicon.png' },
            punti: { type: Number, default: 0 }
        }],
        medaglie: [{
            nome: { type: String, default: 'default' },
            img: { type: String, default: 'default' }
        }]
    }
});

var User = mongoose.model("user", userSchema);

module.exports = User;