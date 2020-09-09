var fs = require("fs");
var path = require("path");
var moment = require("moment");
var multer = require("multer");

module.exports = function (app, printHandler, cleHandler, storage) {
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get("/", function (req, res) {
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render("pages/index", {
            pgnum: 1, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin,
        }); // load the index.ejs file
    });

    // =====================================
    // SUBMISSION PAGE =====================
    // =====================================
    app.get("/submit", function (req, res) {
        //load the submission page and flash any messages
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render("pages/submit", {
            message: req.flash("submitMessage"),
            pgnum: 2, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin,
        });
    });

    //send the HTML from the single print submission segment to the browser
    //used for adding more than one 3d print in a single submission form
    app.get(
        "/oneprint",
        function (req, res) {
            res.render("partials/submit/oneprint"); //render the html
        },
        function (err, html) {
            res.send(html); //send it to the webapp
        }
    );

    //send the HTML from the single print submission segment to the browser
    //used for adding more than one file in a single submission form
    app.get(
        "/onefile",
        function (req, res) {
            res.render("partials/submit/onefile"); //render the html
        },
        function (err, html) {
            res.send(html); //send it to the webapp
        }
    );

    //main signature page
    app.get("/signaturewillis", function (req, res) {
        console.log("here");
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render("pages/prints/signature", {
            pgnum: 2, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin,
            signlocation: "willis",
        });
    });

    app.get("/signaturedp", function (req, res) {
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render("pages/prints/signature", {
            pgnum: 2, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin,
            signlocation: "dp",
        });
    });

    //patrial containing signature canvas
    app.get(
        "/signaturepad",
        function (req, res) {
            res.render("partials/PrintDetails/signaturePad", {
                fileName: req.body.fileName,
            });
        },
        function (err, html) {
            res.send(html);
        }
    );

    app.get(
        "/sigwaitscreen",
        function (req, res) {
            res.render("partials/PrintDetails/waitontech");
        },
        function (err, html) {
            res.send(html);
        }
    );

    app.get("/bugreport", function (req, res) {
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render("pages/bugreport", {
            pgnum: -1, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin,
        });
    });

    app.get("/prints/thankyou", function (req, res) {
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render("pages/prints/thankyousubmit", {
            pgnum: -1, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin,
        });
    });

    app.get("/prints/error", function (req, res) {
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        res.render("pages/prints/error", {
            pgnum: -1, //tells the navbar what page to highlight
            isAdmin: admin,
            isSuperAdmin: superAdmin,
        });
    });

    app.post("/recievesignature", function (req, res) {
        //printHandler.acceptSignature(req.body.uniqueID, newPath);
        res.json("done");
    });

    //what do do when the user hits submit

    app.post(
        "/submitprint",
        multer({
            storage: multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, path.join(__dirname, "../../Uploads/STLs/"));
                },

                // By default, multer removes file extensions so let's add them back
                filename: function (req, file, cb) {
                    cb(
                        null,
                        Date.now() +
                            file.originalname.split(".")[0] +
                            "-" +
                            path.extname(file.originalname)
                    );
                },
            }),
        }).any(),
        function (req, res) {
            printHandler.handleSubmission(req, function (result) {
                if (result == "success") {
                    res.redirect("/prints/thankyou");
                } else {
                    res.redirect("/prints/error");
                }
            }); //pass the stuff to the print handler
        }
    );

    //what do do when the user hits submit
    app.post(
        "/submitcle",
        multer({
            storage: multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, path.join(__dirname, "../../Uploads/CLE/"));
                },

                // By default, multer removes file extensions so let's add them back
                filename: function (req, file, cb) {
                    cb(
                        null,
                        Date.now() +
                            file.originalname.split(".")[0] +
                            "-" +
                            path.extname(file.originalname)
                    );
                },
            }),
        }).any(),
        function (req, res) {
            cleHandler.handleSubmission(req); //pass the stuff to the print handler
            res.redirect("/submit");
        }
    );
};
// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
