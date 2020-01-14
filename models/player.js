class Player {
    constructor(socket){
        this.socket = socket;
        this.user_id = socket.request.user._id;
        this.inGame = false;
        this.username = "";
        this.mazzo = []
    }
}

module.exports = Player;