var passport = require("passport");
var GoogleStrategy = require("passport-google-oauth20");
require('dotenv').config();

passport.use(
    new GoogleStrategy({
        // Options for Google Strategy
        callbackURL: "/autenticazione/google/redirect",
        clientID: process.env.clientID,
        clientSecret: process.env.clientSecret
    }, function () {
        // This will fire after authentication
    })
);