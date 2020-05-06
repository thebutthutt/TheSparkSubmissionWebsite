var printQueue = require('./models/printRequest');
const formidable = require('formidable');

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
        //handle incoming uplods
        var filenames = [], materials = [], infills = [], colors = [], copies = [], prints = [], patron = [];
        new formidable.IncomingForm().parse(req, function (err, fields, files) {
                patron = fields;
            }).on('field', function(name, field) { 
                //handling duplicate input names cause for some reason formidable doesnt do it yet...
                if (name == 'material') {
                    materials.push(field);
                }
                if (name == 'infill') {
                    infills.push(field);
                }
                if (name == 'color') {
                    colors.push(field);
                }
                if (name == 'copies') {
                    copies.push(field);
                }
            })
            .on('fileBegin', (name, file) => { //change name to something unique
                var time = Date.now();
                file.name = time + file.name;
                file.path = __dirname + '/uploads/' + file.name;
            })
            .on('file', (name, file) => {
                console.log('Uploaded file', file.path); //make sure we got it
                filenames.push(file.path);
            }).on('end', function() {
                prints.push(filenames);
                prints.push(materials);
                prints.push(infills);
                prints.push(colors);
                prints.push(copies);
                submissionHandler.handle(patron, prints);
            });
        req.flash('submitMessage', 'Testing');
        res.redirect('/submit');
    });

    // =====================================
    // PRINTS ===============================
    // =====================================
    // show the prints queue
    app.get('/prints', isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printQueue.find({}, function (err, data) {
            res.render('pages/prints', {
                pgnum: 6, //tells the navbar what page to highlight
                dbdata: data,
                isAdmin: true
            });
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