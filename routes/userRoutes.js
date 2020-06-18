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

    app.post('/users/delete', function (req, res) {
        var euid = req.body.euid || req.query.euid;
        userModel.deleteOne({
            "local.euid": euid
        }, function (err) {
            if (err) {
                console.log(err);
            } else {
            }
        });
        res.json(['done']);
    });

    app.post('/users/promote', function (req, res) {
        var euid = req.body.euid || req.query.euid;
        userModel.findOne({
            "local.euid": euid
        }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                result.isSuperAdmin = true;
                result.save();
            }
        });
        res.json(['done']);
    });

    app.post('/users/demote', function (req, res) {
        var euid = req.body.euid || req.query.euid;
        userModel.findOne({
            "local.euid": euid
        }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                result.isSuperAdmin = false;
                result.save();
            }
        });
        res.json(['done']);
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




    //Display the files pending waive to go into the full action queue
    app.get('/printsPendingWaive', function (req, res) {
        var submissions = [],
            singleSubmission = [],
            filenames = [];
        printRequestModel.find({
            "files": {$elemMatch: {
                "isPendingWaive": true,
                "isRejected": false
            }}
        }, function (err, data) {
            data.forEach(submission => {
                singleSubmission = []; //clear submission array
                filenames = []; //clear filenames array
                singleSubmission.push(submission._id); //submission[i][0] = itemID
                submission.files.forEach(file => {
                    if (file.isPendingWaive == true && file.isRejected == false) {
                        filenames.push(file.fileName);
                    }
                });
                singleSubmission.push(filenames); //submission[i][j] = filenames
                submissions.push(singleSubmission);
            });
            res.render('partials/printsPendingWaive', {
                submissions: submissions
            }); //render the html
        });
    }, function (err, html) {
        res.send(html); //send it to the webapp
    });



    //Display the files pending waive to go into the full action queue
    app.get('/allUsers', function (req, res) {
        var euids = [],
            statuses = [],
            myeuid = req.body.myeuid || req.query.myeuid;
        userModel.find({
        }, function (err, data) {
            data.forEach(element => {
                euids.push(element.local.euid);
                    statuses.push(element.isSuperAdmin);
            });

            res.render('partials/allUsers', {
                euids: euids,
                statuses: statuses,
                myeuid: myeuid
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