module.exports = function(app, passport, userModel, cleHandler, cleRequestModel) {
    // =====================================
    // CLE REQUESTS ========================
    // =====================================
    // show the CNC, Laser, and Embroidery requests

    //page to display all 
    app.get('/workrequests/all', isLoggedIn, function (req, res) {
        cleRequestModel.find({
            "completed": false
        }, function (err, data) { //loading every single top level request FOR NOW
            if (err) {
                console.log(err);
            }
            res.render('pages/workrequests', {
                pgnum: 7,
                dbdata: data,
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
            });
        });
    });
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    req.flash('loginMessage', 'Please log in');
    res.redirect('/login');
}