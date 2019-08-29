var passport = require("passport");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config();
var User = require("../models/user");

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    }).catch(function () {
        console.log("passport.deserializeUser Promise Rejected");
   });
    
});

passport.use(
    new GoogleStrategy({
        // Options for Google Strategy
        clientID: process.env.clientID,
        clientSecret: process.env.clientSecret,
        callbackURL: "/autenticazione/google/redirect"
    }, (accessToken, refreshToken, profile, done) => {
        // This will fire after authentication

        User.findOne({googleId: profile.id}).then((currentUser) => {
            if(currentUser){
                // Already registered
                done(null, currentUser);
            } else {
                // Register new user
                new User({
                    googleId: profile.id,
                    username: profile.displayName,
                    thumbnail: profile._json.image.url
                }).save().then((newUser) => {
                    console.log("Created new user: ", newUser);
                    done(null, newUser);
                }).catch(function () {
                    console.log("User.save Promise Rejected");
               });;
            }
        }).catch(function () {
            console.log("User.findOne Promise Rejected");
       });;
    })
);