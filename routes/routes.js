var fs = require('fs');
var path = require('path');
var moment = require('moment');

module.exports = function (app, printHandler, cleHandler) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        var admin = false, superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render('pages/index', {
            pgnum: 1, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin
        }); // load the index.ejs file
    });

    // =====================================
    // SUBMISSION PAGE =====================
    // =====================================
    app.get('/submit', function (req, res) {
        //load the submission page and flash any messages
        var admin = false, superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render('pages/submit', {
            message: req.flash('submitMessage'),
            pgnum: 2, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin
        });
    });

    //send the HTML from the single print submission segment to the browser
    //used for adding more than one 3d print in a single submission form
    app.get('/oneprint', function (req, res) {
        res.render('partials/submit/oneprint'); //render the html
    }, function (err, html) {
        res.send(html); //send it to the webapp
    });

    //send the HTML from the single print submission segment to the browser
    //used for adding more than one file in a single submission form
    app.get('/onefile', function (req, res) {
        res.render('partials/submit/onefile'); //render the html
    }, function (err, html) {
        res.send(html); //send it to the webapp
    });

    app.get('/signature', function (req, res) {
        var admin = false, superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render('pages/prints/signature', {
            pgnum: 2, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin
        });
    });

    app.get('/signaturepad', function (req, res) {
        res.render('partials/signaturePad');
    }, function (err, html) {
        res.send(html);
    });

    app.post('/recievesignature', function (req, res) {
        var time = moment()
        let base64Image = req.body.dataURL.split(';base64,').pop();
        var fileName = req.body.uniqueID + "_" + time + ".jpg"
        var newPath = path.join(__dirname, '../app/uploads/signatures/', fileName)
        
        fs.writeFile(newPath, base64Image, {encoding: 'base64'}, function(err) {
            console.log('File created');
        });

        console.log(req.body.uniqueID)
        printHandler.acceptSignature(req.body.uniqueID, newPath);

        res.json('done')
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
};