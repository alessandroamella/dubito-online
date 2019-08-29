var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username: String,
    googleId: String,
    thumbnail: String,
    nickname: String
});

var User = mongoose.model("user", userSchema);

module.exports = User;