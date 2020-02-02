class Player {
    constructor(socket){
        this.socket = socket;
        this.user_id = socket.request.user._id;
        this.thumbnail = socket.request.user.thumbnail;
        this.rank = socket.request.user.stats.rank;
        this.punti = socket.request.user.stats.punti;
        this.dataCreazione = socket.request.user.stats.dataCreazione;
        this.inGame = false;
        this.username = "";
        this.mazzo = [];
        this.stats = socket.request.user.stats[0];
        this.giocate = 0;
    }
}

module.exports = Player;