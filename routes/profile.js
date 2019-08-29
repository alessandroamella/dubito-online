var router = require("express").Router();
const User = require('../models/user');


var controllaAccesso = function (req, res, next) {
    if (!req.user) {
        // If user is not logged in
        res.redirect("/autenticazione/google");
    } else {
        next();
    }
}

// router.put("/:id", controllaAccesso, function(req, res){
//     User.findOneAndUpdate(req.params.id, req.body.user, function(err, newNick){
//         if(err){
//             console.log(err)
//             req.flash("error", err);
//         } else {
//             req.flash("success", "Piacere, " + newNick);
//             console.log(req.user);
//             res.redirect("/profilo");
//         }
//     });
// });



router.get("/", controllaAccesso, function (req, res) {
    res.render("profilo", { utente: req.user });
});

module.exports = router;