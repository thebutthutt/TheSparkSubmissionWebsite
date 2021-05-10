var path = require("path");
var numPerPage = 10;
var gcodePath = path.join(__dirname, "..", "..", "Uploads", "Gcode");
var stlPath = path.join(__dirname, "..", "..", "Uploads", "STLs");
var printRequestModel = require("../app/models/newPrintRequest.js");
var attemptModel = require("../app/models/attempt");
var adminRequestHandler = require("../handlers/adminRequestHandler.js");
var payment = require("../app/payment.js");
const archiver = require("archiver");
var fs = require("fs");

module.exports = function (app) {
    //Metainfo about all the prints we have done

    /* -------------------------------------------------------------------------- */
    /*                            Detail View One File                            */
    /* -------------------------------------------------------------------------- */

    //send technician to reveiw page for a specific low level print file
    app.get("/prints/preview", isLoggedIn, async function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printRequestModel.findOne(
            {
                //find the top level submission from the low level file id
                "files._id": fileID,
            },
            async function (err, result) {
                var finalGcode = "";
                if (result.files.id(fileID).review.gcodeName) {
                    finalGcode = path.join(
                        gcodePath,
                        result.files.id(fileID).review.gcodeName
                    );
                }

                var thisFile = result.files.id(fileID);
                var attempts = [];
                for (var thisAttemptID of thisFile.printing.attemptIDs) {
                    attempts.push(await attemptModel.findById(thisAttemptID));
                }

                res.render("pages/singlePrint/previewPrint", {
                    //render the review page
                    pgnum: 4, //prints  `
                    isAdmin: true,
                    timestamp: fileID.dateSubmitted,
                    isSuperAdmin: req.user.isSuperAdmin,
                    name: req.user.name,
                    print: thisFile, //send the review page the file to review
                    attempts: attempts,
                    patron: result.patron,
                    submission: result,
                    filePath: path.join(
                        stlPath,
                        result.files.id(fileID).fileName.replace("#", "%23")
                    ),
                    gcodePath: finalGcode,
                });
            }
        );
    });

    //-----------------------DELETE FILE-----------------------
    //deletes a database entry and asscoiated files
    app.post("/prints/delete", isLoggedIn, async function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        var result = await printRequestModel.findOne({
            "files._id": fileID,
        });

        //delete stl from disk

        try {
            var thisSTLPath = path.join(
                stlPath,
                result.files.id(fileID).fileName
            );
            fs.unlinkSync(thisSTLPath);
        } catch (error) {
            console.error(
                "there was STL error:",
                result.files.id(fileID).fileName,
                error.message
            );
        }

        //delete gcode from disk if it exists

        if (result.files.id(fileID).review.gcodeName) {
            try {
                var thisGcodePath = path.join(
                    gcodePath,
                    result.files.id(fileID).gcodeName
                );
                fs.unlinkSync(thisGcodePath);
            } catch (error) {
                console.error(
                    "there was GCODE error:",
                    result.files.id(fileID).gcodeName,
                    error.message
                );
            }
        }

        result.files.id(fileID).remove(); //remove the single file from the top level print submission
        result.numFiles -= 1; //decrement number of files associated with this print request
        if (result.numFiles < 1) {
            //if no more files in this request delete the request itself
            await printRequestModel.deleteOne({
                _id: result._id,
            });
        } else {
            //else save the top level with one less file
            result.allFilesReviewed = true;
            for (var thisFile of result.files) {
                if (!thisFile.isReviewed) {
                    result.allFilesReviewed = false;
                }
            }

            await result.save();
        }
        res.json(["done"]); //tell the front end the request is done
    });

    //request superadmin to delete
    app.post(
        "/prints/requestdelete",
        isLoggedIn,
        async function (req, res, next) {
            var fileID = req.body.fileID || req.query.fileID;
            var result = await printRequestModel.findOne({
                "files._id": itemID,
            });
            result.files.id(itemID).isPendingDelete = true; //mark that the file is pending delete
            await result.save();
            res.json(["done"]); //tell the front end the request is done
        }
    );

    //undo request SU delete
    app.post("/prints/undodelete", isLoggedIn, async function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        var result = await printRequestModel.findOne({
            "files._id": itemID,
        });
        result.files.id(itemID).isPendingDelete = false; //mark that the file is pending delete
        await result.save();
        res.json(["done"]); //tell the front end the request is done
    });

    //-----------------------WAIVE PAYMENT-----------------------
    app.post("/prints/waive", isLoggedIn, async function (req, res, next) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        if (req.user.isSuperAdmin) {
            await payment.updateDatabase(
                submissionID,
                true,
                req.user.local.euid
            );
        } else {
            var submissionID = req.body.submissionID || req.query.submissionID;
            result.isPendingWaive = true;
            for (var file of result.files) {
                file.payment.isPendingWaive = true;
            }
            await result.save();
        }

        res.json(["done"]);
    });

    app.post(
        "/prints/requestwaive",
        isLoggedIn,
        async function (req, res, next) {
            var submissionID = req.body.submissionID || req.query.submissionID;
            var result = await printRequestModel.findById(submissionID);
            result.isPendingWaive = true;
            for (var file of result.files) {
                file.payment.isPendingWaive = true;
            }
            await result.save();
            //adminRequestHandler.addWaive(submissionID, "print");
            res.json(["done"]); //tell the front end the request is done
        }
    );

    app.post("/prints/undowaive", isLoggedIn, function (req, res, next) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.undoWaive(submissionID, "print");
        res.json(["done"]); //tell the front end the request is done
    });

    //-----------------------DOWNLOAD-----------------------
    //downloads file specified in the parameter
    app.get("/prints/download", isLoggedIn, function (req, res) {
        var fileLocation = req.body.fileID || req.query.fileID;

        var newLocation;
        if (fileLocation.slice(-5).toUpperCase() == "GCODE") {
            newLocation = path.join(gcodePath, fileLocation);
        } else {
            newLocation = path.join(stlPath, fileLocation);
        }

        res.download(newLocation); //send the download
    });

    app.get(
        "/prints/downloadSubmission",
        isLoggedIn,
        async function (req, res) {
            var thisSubmission = await printRequestModel.findById(
                req.query.submissionID
            );
            if (thisSubmission) {
                var zipName =
                    thisSubmission.patron.fname +
                    "_" +
                    thisSubmission.patron.lname +
                    "_" +
                    thisSubmission.dateSubmitted
                        .replace("/", "-")
                        .replace("/", "-") +
                    ".zip";

                var zipLocation = path.join(
                    __dirname,
                    "..",
                    "..",
                    "Uploads",
                    "Zips",
                    zipName
                );
                const output = fs.createWriteStream(zipLocation);

                const archive = archiver("zip", {
                    zlib: { level: 9 }, // Sets the compression level.
                });

                output.on("close", function () {
                    console.log(archive.pointer() + " total bytes");
                    console.log(
                        "archiver has been finalized and the output file descriptor has closed."
                    );
                    res.download(zipLocation);
                });

                archive.pipe(output);

                for (var file of thisSubmission.files) {
                    var thisFile = path.join(stlPath, file.fileName);
                    archive.append(fs.createReadStream(thisFile), {
                        name: file.realFileName,
                    });
                }

                archive.finalize();
            } else {
                res.send(404);
            }
        }
    );

    //-----------------------PUSH REVIEW-----------------------
    //handle technician updating file by reviewing print file

    app.post("/prints/appendNotes", isLoggedIn, async function (req, res) {
        var result = printRequestModel.findOne({
            "files._id": req.body.fileID,
        });

        if (req.body.newNotes != "") {
            var newNoteObject = {
                techName: req.body.name,
                dateAdded: Date.now(),
                notes: req.body.newNotes,
            };
            result.files.id(req.body.fileID).internalNotes.push(newNoteObject);
        }
        await result.save();
        res.redirect("back");
    });

    app.post("/prints/arrived", isLoggedIn, async function (req, res) {
        var now = new Date();
        var thisSubmission = await printRequestModel.findOne({
            "files._id": req.body.fileID,
        });

        var thisFile = thisSubmission.files.id(req.body.fileID);

        thisFile.status = "WAITING_FOR_PICKUP";
        thisFile.pickup.timestampArrivedAtPickup = now;

        await thisSubmission.save();

        var isDone = true;
        for (var file of thisSubmission.files) {
            console.log(file.status);
            if (
                file.status != "REJECTED" &&
                file.status != "WAITING_FOR_PICKUP"
            ) {
                isDone = false;
            }
        }

        if (isDone) {
            console.log("all done");
            thisSubmission.timestampPickupRequested = now;
        }
        await thisSubmission.save();

        res.redirect("/prints/preview?fileID=" + req.body.fileID);
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
