var attemptModel = require("../app/models/attempt");
var fullServicePrinterModel = require("../app/models/fullServicePrinter");
var selfServicePrinterModel = require("../app/models/selfServicePrinter");
var printRequestModel = require("../app/models/newPrintRequest");
var emailer = require("../app/emailer");

module.exports = function (app) {
    app.get("/printers/jobs", isLoggedIn, async function (req, res) {
        var allSelf = await selfServicePrinterModel
            .find({})
            .sort({ printerBarcode: 1 });
        var willisFull = await fullServicePrinterModel.aggregate([
            { $match: { printerLocation: "Willis Library" } },
            {
                $lookup: {
                    from: "attempts",
                    localField: "runningJobID",
                    foreignField: "_id",
                    as: "printJob",
                },
            },
        ]);
        var dpFull = await fullServicePrinterModel.aggregate([
            { $match: { printerLocation: "Discovery Park" } },
            {
                $lookup: {
                    from: "attempts",
                    localField: "runningJobID",
                    foreignField: "_id",
                    as: "printJob",
                },
            },
        ]);
        var readyPrints = await printRequestModel.aggregate([
            {
                $set: {
                    files: {
                        $filter: {
                            input: "$files",
                            as: "item",
                            cond: {
                                $eq: ["$$item.status", "READY_TO_PRINT"],
                            },
                        },
                    },
                },
            },
            { $match: { "files.0": { $exists: true } } },
        ]);
        res.render("pages/printJobs/printjobs", {
            pgnum: 7, //printers'
            selfService: allSelf,
            willisFull: willisFull,
            dpFull: dpFull,
            readyPrints: readyPrints,
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
            userID: req.user._id,
        });
    });

    app.post("/attempts/start", isLoggedIn, async function (req, res) {
        /**
         * printerID, printerName, printerLocation, rollID, startWeight, selectedFileIDs, selectedFileNames
         */
        var selectedFiles = req.body.selectedFileIDs.split(",");
        var selectedFileNames = req.body.selectedFileNames.split(",");
        var newAttempt = new attemptModel({
            timestampStarted: new Date(),
            location: req.body.printerLocation,
            printerName: req.body.printerName,
            printerID: req.body.printerID,
            rollID: req.body.rollID,
            startWeight: req.body.startWeight,
            startedBy: req.user.local.euid,
            fileIDs: selectedFiles,
            fileNames: selectedFileNames,
        });
        await newAttempt.save();

        var thisPrinter = await fullServicePrinterModel.findOne({
            _id: req.body.printerID,
        });
        thisPrinter.runningJobID = newAttempt._id;
        await thisPrinter.save();

        for await (var thisFileID of selectedFiles) {
            var thisSubmission = await printRequestModel.findOne({
                "files._id": thisFileID,
            });
            var thisFile = thisSubmission.files.id(thisFileID);
            thisFile.status = "PRINTING";
            thisFile.printing.printingLocation = req.body.printerLocation;
            thisFile.printing.attemptIDs.push(newAttempt._id);
            await thisSubmission.save();
        }

        res.redirect("/printers/jobs");
    });

    app.post("/attempts/finish", isLoggedIn, async function (req, res) {
        //attemptID, endWeght, status, autonotify
        var now = new Date();
        var thisAttempt = await attemptModel.findById(req.body.attemptID);
        thisAttempt.isFinished = true;
        if (req.body.status == "success") {
            thisAttempt.isSuccess = true;
        } else {
            thisAttempt.isFailure = true;
        }
        thisAttempt.finishedBy = req.user.local.euid;
        thisAttempt.endWeight = req.body.endWeight;
        thisAttempt.timestampEnded = now;
        await thisAttempt.save();

        var relatedPrinter = await fullServicePrinterModel.findOne({
            runningJobID: thisAttempt._id,
        });
        relatedPrinter.runningJobID = null;
        await relatedPrinter.save();

        for await (var thisFileID of thisAttempt.fileIDs) {
            var thisSubmission = await printRequestModel.findOne({
                "files._id": thisFileID,
            });
            var thisFile = thisSubmission.files.id(thisFileID);

            if (req.body.status == "success") {
                thisFile.status = "WAITING_FOR_PICKUP";
                thisFile.printing.timestampPrinted = now;
                if (thisAttempt.location != thisFile.request.pickupLocation) {
                    thisFile.status = "IN_TRANSIT";
                } else {
                    thisFile.pickup.timestampArrivedAtPickup = now;
                }
            } else {
                thisFile.status = "READY_TO_PRINT";
            }
            await thisSubmission.save();
            //check if all files completed to send done email
            var isDone = true;
            for (var thisFile of thisSubmission.files) {
                if (
                    thisFile.status != "REJECTED" &&
                    thisFile.status != "WAITING_FOR_PICKUP"
                ) {
                    isDone = false;
                }
            }

            if (isDone) {
                //done email
                console.log("submission complete");
                thisSubmission.timestampPickupRequested = now;
            }

            await thisSubmission.save();
        }
        res.redirect("/printers/jobs");
    });
};
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
