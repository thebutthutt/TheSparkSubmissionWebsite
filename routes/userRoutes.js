module.exports = function (app, passport, userModel, adminRequestHandler, printRequestModel, cleRequestModel) {
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', isLoggedOut, function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('pages/login', {
            message: req.flash('loginMessage'),
            pgnum: 3, //tells the navbar what page to highlight
            isAdmin: false
        });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('pages/signup', {
            message: req.flash('signupMessage'),
            pgnum: 3, //tells the navbar what page to highlight
            isAdmin: false
        });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('pages/profile', {
            message: req.flash('logoutMessage'),
            pgnum: 3, //tells the navbar what page to highlight
            user: req.user, // get the user out of session and pass to template
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin
        });
    });

    app.get('/accounts/delete', function (req, res) {
        var userID = req.body.userID || req.query.userID;
        userModel.deleteOne({
            "_id": userID
        }, function (err) {
            if (err) {
                console.log(err);
            }
        });
        res.redirect('/logout');
    });


    //Display the files pending delete to go into the full action queue
    app.get('/printsPendingDelete', function (req, res) {
        var filenames = [],
            fileIDs = [];
        printRequestModel.find({
            "files.isPendingDelete": true
        }, function (err, data) {
            data.forEach(element => {
                element.files.forEach(file => {
                    if (file.isPendingDelete == true) {
                        filenames.push(file.fileName);
                        fileIDs.push(file._id);
                    }
                })
            });

            res.render('partials/printsPendingDelete', {
                filenames: filenames,
                fileIDs: fileIDs
            }); //render the html
        });
    }, function (err, html) {
        res.send(html); //send it to the webapp
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
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

//make sure user is logged out
function isLoggedOut(req, res, next) {

    //if the user is already logged in, send them to their profile page
    if (req.isAuthenticated()) {
        req.flash('logoutMessage', 'You\'re already logged in!');
        res.redirect('/profile');
    } else {
        //else let them to the login page
        return next();
    }

}