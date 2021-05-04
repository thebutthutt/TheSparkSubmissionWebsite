var printRequestModel = require("../app/models/newPrintRequest");
var newmailer = require("../app/emailer.js");
var payment = require("../app/payment.js");

module.exports = function (app) {
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

    app.post("/recievesignature", async function (req, res) {
        var submission = await printRequestModel.findOne({
            "files._id": req.body.uniqueID,
        });
        submission.files.id(req.body.uniqueID).isSigned = true;
        await submission.save();
        res.json("done");
    });

    //-----------------------LANDING AFTER PAYMENT-----------------------
    //displays to the user once they sucesfully submit payment through 3rd party service
    app.get("/payment/complete", async function (req, res) {
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        var paidSubmissionID = await payment.handlePaymentURL(req);
        if (paidSubmissionID) {
            var now = new Date();
            var submission = await printRequestModel.findById(paidSubmissionID);
            for (var file of submission.files) {
                file.isPendingPayment = false;
                file.isPendingWaive = false;
                if (file.isRejected == false) {
                    file.wasPaid = true;
                    file.timestampPaid = now;
                    file.isReadyToPrint = true;
                    file.isPendingWaive = false;
                }
            }
            submission.timestampPaid = now;
            newmailer.paymentThankYou(submission);

            await submission.save();

            res.render("pages/prints/thankyoupayment", {
                //render the success page
                data: req.query,
                pgnum: 0,
                isAdmin: admin,
                isSuperAdmin: superAdmin,
            });
        } else {
            console.log("payment wrong");
        }
    });

    app.post("/sendbugreport", function (req, res) {
        //emailer.sendBug(req.body);
        res.redirect("/");
    });
};
// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
