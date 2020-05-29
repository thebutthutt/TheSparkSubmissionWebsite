module.exports = function (app, passport, printHandler, cleHandler, printRequestModel, cleRequestModel, payment) {

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

    //send the HTML from the single print submission segment to the browser
    //used for adding more than one file in a single submission form
    app.get('/onefile', function (req, res) {
        res.render('partials/onefile'); //render the html
    }, function (err, html) {
        res.send(html); //send it to the webapp
    });

    //what do do when the user hits submit
    app.post('/submitprint', function (req, res) {
        printHandler.handleSubmission(req); //pass the stuff to the print handler
        req.flash('submitMessage', 'Submitted the print!');
        res.redirect('/submit');
    });

    //what do do when the user hits submit
    app.post('/submitcle', function (req, res) {
        cleHandler.handleSubmission(req); //pass the stuff to the print handler
        req.flash('submitMessage', 'Submitted the request!');
        res.redirect('/submit');
    });




    // =====================================
    // PRINTS ===============================
    // =====================================
    // show the new prints queue
    app.get('/prints/new', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.find({
            "hasNew": true
        }, function (err, data) { //loading every single top level request FOR NOW
            res.render('pages/newSubmissions', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "newSub",
                isAdmin: true
            });
        });

    });

    //send technician to reveiw page for a specific low level print file
    app.get('/prints/preview', function(req, res){
        var fileID = req.body.fileID || req.query.fileID;
        printRequestModel.findOne({ //find the top level submission from the low level file id
            'files._id': fileID
        }, function (err, result) {
            res.render('pages/previewPrint', { //render the review page
                pgnum: 7,
                isAdmin: true,
                timestamp: fileID.dateSubmitted,
                print: result.files.id(fileID) //send the review page the file to review
            });
        });
    });

    //show pending payment prints
    app.get('/prints/pendpay', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.find({
            "hasPendingPayment": true
        }, function (err, data) { //loading every single top level request FOR NOW
            res.render('pages/pendingPayment', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "pendpay",
                isAdmin: true
            });
        });

    });

    //show pready to print all locations
    app.get('/prints/ready', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.find({
            "hasReadyToPrint": true
        }, function (err, data) { //loading every single top level request FOR NOW
            res.render('pages/ready', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "ready",
                location: "all",
                isAdmin: true
            });
        });

    });

    //show ready to print at willis
    app.get('/prints/readywillis', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.find({
            "hasReadyToPrint": true,
            "files.printLocation": "Willis Library"
        }, function (err, data) { //loading every single top level request FOR NOW
            res.render('pages/ready', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "ready",
                location: "Willis Library",
                isAdmin: true
            });
        });

    });

    //show ready to print at dp
    app.get('/prints/readydp', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.find({
            "hasReadyToPrint": true,
            "files.printLocation": "Discovery Park"
        }, function (err, data) { //loading every single top level request FOR NOW
            res.render('pages/ready', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "ready",
                location: "Discovery Park",
                isAdmin: true
            });
        });

    });

    //show rejected files
    app.get('/prints/rejected', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.find({
            "hasNew": false,
            "hasRejected": true,
        }, function (err, data) { //loading every single top level request FOR NOW
            res.render('pages/rejected', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "rejected",
                location: "willis",
                isAdmin: true
            });
        });

    });

    //displays to the user once they sucesfully submit payment through 3rd party service
    app.get('/payment/complete', function (req, res) {
        var admin = false;
        if (req.isAuthenticated()) {
            admin = true;
        }
        payment.handlePaymentComplete(req, function (success, submissionID) {//tell the payment handler to update our databases
            if (success == true) {
                printHandler.recievePayment(submissionID, function callback() {
                    console.log('updated database hopefully');
                });
                res.render('pages/paymentComplete', { //render the success page
                    data: req.query,
                    pgnum: 6,
                    isAdmin: admin
                });
            } else {
                console.log("invalid payment URL");
            }
        }); 
        
    });




    //deletes a database entry and asscoiated files
    app.post('/prints/delete', function (req, res, next) {
        var fileID = req.body.userId || req.query.userId;
        printHandler.deleteFile(fileID);
        res.json(['done']); //tell the front end the request is done
    });

    //downloads file specified in the parameter
    app.get('/prints/download', function(req, res){
        var fileLocation = req.body.fileID || req.query.fileID;
        res.download(fileLocation); //send the download
    });

    //handle technician updating file by reviewing print file
    app.post('/prints/singleReview', function(req, res) {
        printHandler.updateSingle(req, function callBack() { //send all the stuff to the submission handler
            res.redirect('/prints/new'); //when we are done tell the review page it's okay to reload now
        });
    });

    //simple change location without reviewing
    app.post('/prints/changeLocation', function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printRequestModel.findOne({
            "files._id": fileID
        }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                if (result.files.id(fileID).printLocation == "Willis Library") {
                    result.files.id(fileID).printLocation = "Discovery Park";
                } else {
                    result.files.id(fileID).printLocation = "Willis Library";
                }
                result.save();
            }
        });
        res.json(['done']);
    });

    app.post('/prints/requestPayment', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        printHandler.requestPayment(submissionID, function callback() {
            res.json(['done']); //tell the front end the request is done
        });
    });

    app.post('/prints/recievePayment', function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        printHandler.recievePayment(submissionID, function callback() {
            res.json(['done']); //tell the front end the request is done
        });
    });

    
    // =====================================
    // CLE REQUESTS ========================
    // =====================================
    // show the CNC, Laser, and Embroidery requests

    //page to display all 
    app.get('/workrequests/all', function (req, res) {

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