class Player {
    constructor(socket){
        this.socket = socket;
        this.user_id = socket.request.user._id;
        this.inGame = false;
        this.username = "";
        this.mazzo = []
        this.stats = {
            rank: "",
            punti: 0,
            partiteGiocate: [],
            vittorie: 0,
            sconfitte: 0,
            vittorieConsecutive: 0,
            warns: [],
            carteGiocate: 0,
            obiettivi: [],
            medaglie: []
        }
    }
}

module.exports = Player;