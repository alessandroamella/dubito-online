var router = require("express").Router();
var passport = require("passport");

// Login route
router.get("/login", function(req, res){
    res.render("login", { user: req.user });
});

// Auth with Google, get profile information
router.get("/google", passport.authenticate("google", {
    scope: ['profile', 'email']
}));

// Callback route for Google to redirect
router.get("/google/redirect", passport.authenticate("google"), function(req, res){
    res.redirect("/profilo");
});

// Logout
router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

// Export router
module.exports = router;