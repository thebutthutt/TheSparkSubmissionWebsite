var filamentHandler = require("../handlers/filamentHandler.js");

module.exports = function (app) {
    app.get("/tester", isLoggedIn, async function (req, res) {
        console.log(req.session);
        filamentHandler.testSharepoint(req.session.sharepoint);
        //grab most recently stored data by default
        //var metadata = await printHandler.metainfo();
        res.render("pages/prints/meta", {
            pgnum: 5,
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
        });
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
