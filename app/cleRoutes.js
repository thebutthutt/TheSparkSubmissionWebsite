module.exports = function (app, passport, userModel, cleHandler, cleRequestModel) {
    // =====================================
    // CLE REQUESTS ========================
    // =====================================
    // show the CNC, Laser, and Embroidery requests

    //page to display all 
    app.get('/workrequests/all', isLoggedIn, function (req, res) {
        cleRequestModel.find({
            "isCompleted": false
        }, function (err, data) { //loading every single top level request FOR NOW
            if (err) {
                console.log(err);
            }
            res.render('pages/workrequests', {
                pgnum: 5, //workrequests
                dbdata: data,
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
            });
        });
    });

    app.post('/workrequests/delete', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        cleHandler.deleteSubmission(submissionID);
        res.json(['done']); //tell the front end the request is done
    });

    app.post('/workrequests/requestdelete', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.addDelete(submissionID, "cle");
        res.json(['done']); //tell the front end the request is done
    });

    app.post('/workrequests/undodelete', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.undoDelete(submissionID, "cle");
        res.json(['done']); //tell the front end the request is done
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