var selfServiceLogModel = require("../app/models/selfServiceLog");
var selfServicePrinterModel = require("../app/models/selfServicePrinter");

module.exports = function (app) {
    app.get("/selfservice", isLoggedIn, async function (req, res) {
        var logs = await selfServiceLogModel.find({}).sort({ _id: -1 });
        console.log(logs);
        var printers = await selfServicePrinterModel
            .find()
            .sort({ printerBarcode: 1 });
        res.render("pages/selfService/eaglesCurrent", {
            pgnum: 6, //prints'
            data: logs,
            printers: printers,
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
            userID: req.user._id,
        });
    });

    app.post("/selfservice/checkout", isLoggedIn, function (req, res) {
        var newLog = req.body;
        newLog.checkedOutBy = req.user._id;
        var newSelfServiceLog = new selfServiceLogModel(newLog);
        selfServicePrinterModel.findOne(
            { printerName: newLog.printerName },
            function (err, result) {
                if (!result) {
                    var newSelfServicePrinter = new selfServicePrinterModel({
                        printerName: newLog.printerName,
                        isCheckedOut: true,
                        currentSelfServiceLog: newSelfServiceLog._id,
                    });
                    newSelfServicePrinter.save(function (err, result) {
                        newSelfServiceLog.save(function (err, result) {
                            renderPage();
                        });
                    });
                } else {
                    result.isCheckedOut = true;
                    result.currentSelfServiceLog = newSelfServiceLog._id;
                    result.save(function (err, result) {
                        newSelfServiceLog.save(function (err, result) {
                            renderPage();
                        });
                    });
                }
            }
        );

        const renderPage = function () {
            res.redirect("/selfservice");
        };
    });

    app.post("/selfservice/checkin", isLoggedIn, function (req, res) {
        var logID = req.body.logid;
        selfServiceLogModel.findById(logID, function (err, result) {
            result.checkedIn = req.body.checkedin;
            result.rollEndWeight = req.body.rollendweight;
            result.checkedInBy = req.user._id;
            result.save(function (err, done) {
                selfServicePrinterModel.findOne(
                    { printerName: done.printerName },
                    function (err, printer) {
                        printer.isCheckedOut = false;
                        printer.currentSelfServiceLog = "";
                        printer.save(function (err, final) {
                            res.redirect("/selfservice");
                        });
                    }
                );
            });
        });
    });

    app.post("/selfservice/delete", isLoggedIn, async function (req, res) {
        var logID = req.body.logID;
        await selfServiceLogModel.deleteOne({ _id: logID });
        res.redirect("/selfservice");
    });
};

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
