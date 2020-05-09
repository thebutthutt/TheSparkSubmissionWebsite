var printRequestModel = require('./models/printRequest');
const fs = require('fs');


module.exports = function (app, passport, submissionHandler) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        var admin = false;
        if (req.isAuthenticated()) {
            admin = true;
        }
        res.render('pages/index', {
            pgnum: 1, //tells the navbar what page to highlight
            isAdmin: admin
        }); // load the index.ejs file
    });

    // =====================================
    // SUBMISSION PAGE =====================
    // =====================================
    app.get('/submit', function (req, res) {
        //load the submission page and flash any messages
        var admin = false;
        if (req.isAuthenticated()) {
            admin = true;
        }
        res.render('pages/submit', {
            message: req.flash('submitMessage'),
            pgnum: 2, //tells the navbar what page to highlight
            isAdmin: admin
        });
    });

    //send the HTML from the single print submission segment to the browser
    //used for adding more than one 3d print in a single submission form
    app.get('/oneprint', function (req, res) {
        res.render('partials/oneprint'); //render the html
    }, function (err, html) {
        res.send(html); //send it to the webapp
    });

    app.post('/submit', function (req, res) {
        submissionHandler.handleSubmission(req); //pass the stuff to the submission handler
        req.flash('submitMessage', 'Testing');
        res.redirect('/submit');
    });

    // =====================================
    // PRINTS ===============================
    // =====================================
    // show the prints queue
    app.get('/prints', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.find({}, function (err, data) {
            res.render('pages/newSubmissions', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                isAdmin: true
            });
        });

    });

    //deletes a database entry
    app.post('/prints/delete', function (req, res, next) {
        var userId = req.body.userId || req.query.userId;
        console.log("Trying deletion");
        printRequestModel.find({ //find top level print request by single file ID
            'files._id': userId
        }, function (err, result) {
            fs.unlink(result[0].files.id(userId).fileName, function(err){
                if (err) {
                    console.log(err);
                }
            }); //delete the file on disk
            result[0].files.id(userId).remove(); //remove the single file from the top level print submission
            result[0].numFiles -= 1; //decrement nu,ber of files associated with this print request
            if (result[0].numFiles < 1) { //if no more files in this request delete the request itself
                printRequestModel.deleteOne({'_id' : result[0]._id}, function(err) { //delete top level request
                    if (err) console.log(err);
                    console.log("Successful deletion");
                });
            } else { //else save the top level with one less file
                result[0].save(function (err) { //save top level request db entry
                    if (err) console.log(err);
                    console.log("Successful deletion");
                });
            }
            res.json(['done']); //tell the front end the request is done
        });
    });

    //downloads file specified in the parameter
    app.get('/prints/download', function(req, res){
        var fileID = req.body.fileID || req.query.fileID;
        console.log(fileID);
        res.download(fileID); //send the download
    });

    //send to reveiw page
    app.get('/prints/preview', function(req, res){
        var fileID = req.body.fileID || req.query.fileID;
        printRequestModel.find({
            'files._id': fileID
        }, function (err, result) {
            res.render('pages/previewPrint', {
                pgnum: 7,
                isAdmin: true,
                print: result[0].files.id(fileID) //send the review page the file to review
            });
        });
        console.log(fileID);
    });

    app.post('/prints/singleReview', function(req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        submissionHandler.updateSingle(req, function callBack() {
            res.json(['done']);
        });
    });


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
            pgnum: 4, //tells the navbar what page to highlight
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
            pgnum: 5, //tells the navbar what page to highlight
            user: req.user, // get the user out of session and pass to template
            isAdmin: true
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
};

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