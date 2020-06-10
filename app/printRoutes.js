module.exports = function (app, passport, userModel, adminRequestHandler, printHandler, printRequestModel, payment) {
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
                pgnum: 4, //prints
                dbdata: data,
                printPage: "newSub",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
            });
        });

    });

    //send technician to reveiw page for a specific low level print file
    app.get('/prints/preview', isLoggedIn, function(req, res){
        var fileID = req.body.fileID || req.query.fileID;
        printRequestModel.findOne({ //find the top level submission from the low level file id
            'files._id': fileID
        }, function (err, result) {
            res.render('pages/previewPrint', { //render the review page
                pgnum: 4, //prints
                isAdmin: true,
                timestamp: fileID.dateSubmitted,
                isSuperAdmin: req.user.isSuperAdmin,
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
                pgnum: 4, //prints
                dbdata: data,
                printPage: "pendpay",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
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
                pgnum: 4, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "ready",
                location: "all",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
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
                pgnum: 4, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "ready",
                location: "Willis Library",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
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
                pgnum: 4, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "ready",
                location: "Discovery Park",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
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
                pgnum: 4, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "rejected",
                location: "willis",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin
            });
        });

    });

    //displays to the user once they sucesfully submit payment through 3rd party service
    app.get('/payment/complete', function (req, res) {
        var admin = false, superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        payment.handlePaymentComplete(req, function (success, submissionID) {//tell the payment handler to update our databases
            if (success == true) {
                printHandler.recievePayment(submissionID, function callback() {
                    console.log('updated database hopefully');
                });
                res.render('pages/paymentComplete', { //render the success page
                    data: req.query,
                    pgnum: 0,
                    isAdmin: admin,
                    isSuperAdmin: superAdmin
                });
            } else {
                console.log("invalid payment URL");
            }
        }); 
        
    });

    //deletes a database entry and asscoiated files
    app.post('/prints/delete', function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        printHandler.deleteFile(fileID);
        res.json(['done']); //tell the front end the request is done
    });

    app.post('/prints/requestdelete', function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        adminRequestHandler.addDelete(fileID, "print");
        res.json(['done']); //tell the front end the request is done
    });

    app.post('/prints/undodelete', function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        adminRequestHandler.undoDelete(fileID, "print");
        res.json(['done']); //tell the front end the request is done
    });



    app.post('/prints/waive', function (req, res, next) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        printHandler.recievePayment(submissionID, function callback() {
            res.json(['done']); //tell the front end the request is done
        });
    });

    app.post('/prints/requestwaive', function (req, res, next) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.addWaive(submissionID, "print");
        res.json(['done']); //tell the front end the request is done
    });

    app.post('/prints/undowaive', function (req, res, next) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.undoWaive(submissionID, "print");
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