var router = require("express").Router();
var passport = require("passport");

// Login route
router.get("/login", function(req, res){
    res.render("login");
});

// Auth with Google, get profile information
router.get("/google", passport.authenticate("google", {
    scope: ['profile']
}));

// Logout
router.get("/logout", function(req, res){
    res.send("Log out clicked!");
});

// Export router
module.exports = router;