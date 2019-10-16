var middlewareObj = {};

middlewareObj.controllaAccesso = function(req, res, next){
    if (!req.user) {
        // If user is not logged in
        res.redirect("/autenticazione/google");
    } else {
        next();
    }
}

module.exports = middlewareObj;