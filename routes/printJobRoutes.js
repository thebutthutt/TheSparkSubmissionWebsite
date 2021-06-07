var attemptModel = require("../app/models/attempt");
var fullServicePrinterModel = require("../app/models/fullServicePrinter");
var selfServicePrinterModel = require("../app/models/selfServicePrinter");
var printRequestModel = require("../app/models/newPrintRequest");
var emailer = require("../app/emailer");
var axios = require("axios");
const { table } = require("table");

module.exports = function (app) {
    app.get("/printers/jobs", isLoggedIn, async function (req, res) {
        // get all self service printers and their currently running jobs
        var allSelf = await selfServicePrinterModel.aggregate([
            {
                $lookup: {
                    from: "attempts",
                    localField: "runningJobID",
                    foreignField: "_id",
                    as: "printJob",
                },
            },
            {
                $sort: {
                    printerBarcode: 1,
                },
            },
        ]);

        //get all willis printers with their current running jobs
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

        //get all DP printers with their current running jobs
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

        //get all files ready to print
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
         * printerID,
         * printerName,
         * printerLocation,
         * rollID,
         * startWeight,
         * selectedFileIDs,
         * selectedFileNames
         */

        //Grab filenames and IDs
        var selectedFiles = req.body.selectedFileIDs.split(",");
        selectedFiles = selectedFiles.map((x) => x.trim());

        var selectedFileNames = req.body.selectedFileNames.split(",");
        selectedFileNames = selectedFileNames.map((x) => x.trim());

        //Generate unique ID
        var now = new Date();
        var diffMinutes = Math.round((now - (now.getFullYear(), 0, 1)) / 60000); //how many minutes since the year began
        var attemptID =
            req.body.printerName.replace(/\s+/g, "") +
            "-" +
            diffMinutes.toString(36);

        //Create new attempt
        var newAttempt = new attemptModel({
            prettyID: attemptID,
            timestampStarted: now,
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

        //set this printer current running attempt
        var thisPrinter = await fullServicePrinterModel.findOne({
            _id: req.body.printerID,
        });
        thisPrinter.runningJobID = newAttempt._id;
        await thisPrinter.save();

        //update status of all selected files
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

        //outsource reciept printing
        sendPrintSlip(newAttempt);

        //done
        res.redirect("/printers/jobs");
    });

    app.post("/attempts/reprint", isLoggedIn, async function (req, res) {
        try {
            var thisAttempt = await attemptModel.findById(req.body.attemptID);
            sendPrintSlip(thisAttempt);
        } catch (err) {
            console.log(err);
        }
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

            var inTransit = [],
                atLocation = [];

            for (var thisFile of thisSubmission.files) {
                if (
                    !["REJECTED", "WAITING_FOR_PICKUP", "IN_TRANSIT"].includes(
                        thisFile.status
                    )
                ) {
                    isDone = false;
                } else {
                    if (thisFile.status == "WAITING_FOR_PICKUP") {
                        atLocation.push(thisFile);
                    } else if (thisFile.status == "IN_TRANSIT") {
                        inTransit.push(thisFile);
                    }
                }
            }

            if (isDone) {
                //done email
                emailer.allFinishedPrinting(
                    thisSubmission,
                    inTransit,
                    atLocation
                );
                console.log("submission complete");
                thisSubmission.timestampPickupRequested = now;
            }

            await thisSubmission.save();
        }
        res.redirect("/printers/jobs");
    });
};

function sendPrintSlip(attempt) {
    const attemptData = [
        [
            "Started",
            attempt.timestampStarted.toLocaleDateString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            }) +
                " @ " +
                attempt.timestampStarted.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                }),
        ],
        ["Maker", attempt.startedBy],
        ["Printer", attempt.printerName],
        ["Location", attempt.location],
        ["Files", attempt.fileNames.length],
    ];

    const attemptConfig = {
        drawVerticalLine: (lineIndex, columnCount) => {
            return false;
        },
        drawHorizontalLine: (lineIndex, rowCount) => {
            return (
                lineIndex === 0 ||
                lineIndex === 1 ||
                lineIndex === 3 ||
                lineIndex === rowCount - 1 ||
                lineIndex === rowCount
            );
        },
        columns: [
            { alignment: "left", width: 8 },
            { alignment: "right", width: 19 },
        ],
        header: {
            alignment: "center",
            content: attempt.prettyID,
        },
    };

    var filesData = [];
    for (var thisFile of attempt.fileNames) {
        filesData.push([thisFile]);
    }

    const filesConfig = {
        columns: [{ width: 30 }],
        drawVerticalLine: (lineIndex, columnCount) => {
            //return lineIndex === 0 || lineIndex === columnCount;
            return false;
        },
        drawHorizontalLine: (lineIndex, rowCount) => {
            return lineIndex === rowCount;
        },
    };

    const finalTable =
        table(attemptData, attemptConfig) +
        table(filesData, filesConfig).trimEnd();

    const finalLines = finalTable.split(/\r\n|\r|\n/);
    axios
        .post("http://129.120.93.30:5000/print", { lines: finalLines })
        .then((res) => {
            console.log("Printed");
        })
        .catch((error) => {
            console.error("Error Printing");
        });
}

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
