var printRequestModel = require("../app/models/newPrintRequest.js");
var payment = require("../app/payment.js");
var newmailer = require("../app/emailer");

module.exports = function (app) {
    //-----------------------SEND PAYMENT EMAIL-----------------------
    app.post("/prints/requestPayment", isLoggedIn, async function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        console.log(submissionID);
        var now = new Date();
        var result = await printRequestModel.findOne({
            _id: submissionID,
        });

        var acceptedFiles = [],
            rejectedFiles = [];
        var shouldBeWaived = result.isForClass || result.isForDepartment;

        //calculate paumet amount
        var amount = 0.0;
        for (var file of result.files) {
            if (
                file.review.descision == "Accepted" &&
                (file.status == "REVIEWED" || file.status == "PENDING_PAYMENT")
            ) {
                var thisFilePrice = Math.max(
                    file.review.slicedHours + file.review.slicedMinutes / 60,
                    1
                );
                amount += thisFilePrice;
                file.payment.price = thisFilePrice;
                file.payment.timestampPaymentRequested = now;
                if (shouldBeWaived) {
                    file.payment.isPendingWaive = true;
                }
                file.status = "PENDING_PAYMENT";
                acceptedFiles.push(file._id);
            } else {
                rejectedFiles.push(file._id);
                file.status = "REJECTED";
            }
        }
        amount = Math.round((amount + Number.EPSILON) * 100) / 100; //make it a normal 2 decimal place charge
        amount = amount.toFixed(2); //correct formatting

        //if the submission had any accepted files, we will ask for payment
        if (acceptedFiles.length > 0) {
            result.timestampPaymentRequested = now;
            payment.sendPaymentEmail(result, 0.01, rejectedFiles.length);
            if (shouldBeWaived) {
                result.isPendingWaive = true;
            }
        } else {
            result.timestampPaymentRequested = now;
            newmailer.allRejected(result);
        }

        //save result to the database with updated flags
        await result.save();
        res.json(["done"]);
    });

    //-----------------------HANDLE PAYMENT INCOME-----------------------
    app.post("/prints/recievePayment", isLoggedIn, async function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        await payment.updateDatabase(submissionID, false, "");
        res.json(["done"]);
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
