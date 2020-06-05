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
            isSuperAdmin: req.user.superAdmin
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
};