var multer = require("multer");
var path = require("path");
var numPerPage = 10;
var gcodePath = path.join(__dirname, "..", "..", "Uploads", "Gcode");
var stlPath = path.join(__dirname, "..", "..", "Uploads", "STLs");
var printRequestModel = require("../app/models/newPrintRequest.js");
var attemptModel = require("../app/models/attempt");
var newmailer = require("../app/emailer.js");
const NodeStl = require("node-stl");
var printHandler = require("../handlers/printHandler.js");
var adminRequestHandler = require("../handlers/adminRequestHandler.js");
var payment = require("../app/payment.js");
const archiver = require("archiver");
var fs = require("fs");
const { newSubmission } = require("../app/emailer.js");

module.exports = function (app) {
    //Metainfo about all the prints we have done
    app.get("/meta", isLoggedIn, async function (req, res) {
        //grab most recently stored data by default
        //var metadata = await printHandler.metainfo();
        res.render("pages/prints/meta", {
            pgnum: 5,
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
        });
    });

    /* -------------------------------------------------------------------------- */
    /*                           Submit A Print Request                           */
    /* -------------------------------------------------------------------------- */

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
                            "-" +
                            file.originalname.split(".")[0] +
                            path.extname(file.originalname)
                    );
                },
            }),
        }).any(),
        async function (req, res) {
            console.log(req.body);
            console.log(req.files);
            var materials = Array.isArray(req.body.material)
                    ? req.body.material
                    : Array.of(req.body.material),
                infills = Array.isArray(req.body.infill)
                    ? req.body.infill
                    : Array.of(req.body.infill),
                copies = Array.isArray(req.body.copies)
                    ? req.body.copies
                    : Array.of(req.body.copies),
                colors = Array.isArray(req.body.color)
                    ? req.body.color
                    : Array.of(req.body.color),
                notes = Array.isArray(req.body.notes)
                    ? req.body.notes
                    : Array.of(req.body.notes),
                pickups = Array.isArray(req.body.pickup)
                    ? req.body.pickup
                    : Array.of(req.body.pickup),
                patron = {
                    fname: req.body.first,
                    lname: req.body.last,
                    email: req.body.email,
                    euid: req.body.euid,
                    phone: req.body.phone,
                },
                numFiles = 0;
            var submissionDetails = {
                classDetails: {
                    classCode: req.body.classCode,
                    professor: req.body.professor,
                    projectType: req.body.projectType,
                },
                internalDetails: {
                    department: req.body.department,
                    project: req.body.project,
                },
            };
            var now = new Date();

            var newSubmission = new printRequestModel();
            newSubmission.patron = patron;
            newSubmission.timestampSubmitted = now;
            newSubmission.files = [];
            //for each file
            for (var index = 0; index < req.files.length; index++) {
                //for each copy of this file
                for (var thisCopy = 0; thisCopy < copies[index]; thisCopy++) {
                    numFiles++;
                    var calcVolume = 0;
                    try {
                        var stl = new NodeStl(req.files[index].path, {
                            density: 1.04,
                        });
                        calcVolume = stl.volume;
                    } catch (error) {
                        console.log(error);
                    }
                    newSubmission.files.push({
                        fileName: req.files[index].filename,
                        originalFileName: req.files[index].originalname,
                        request: {
                            timestampSubmitted: now,
                            material: materials[index],
                            infill: infills[index],
                            color: colors[index],
                            notes: notes[index],
                            pickupLocation: pickups[index],
                        },
                        review: {
                            calculatedVolumeCm: calcVolume,
                        },
                        payment: {
                            isPendingWaive: Object.values(
                                submissionDetails.classDetails
                            ).some((x) => x !== null && x !== "")
                                ? true
                                : false,
                        },
                        printing: {},
                        pickup: {},
                    });
                }
            }
            newSubmission.numFiles = numFiles;
            if (
                Object.values(submissionDetails.classDetails).some(
                    (x) => x !== null && x !== ""
                )
            ) {
                newSubmission.isForClass = true;
                newSubmission.isForDepartment = false;
                newSubmission.classDetails = submissionDetails.classDetails;
            }
            //if at least one department detail is filled
            else if (
                Object.values(submissionDetails.classDetails).some(
                    (x) => x !== null && x !== ""
                )
            ) {
                newSubmission.isForDepartment = true;
                newSubmission.isForClass = false;
                newSubmission.internalDetails =
                    submissionDetails.internalDetails;
            }
            console.log(newSubmission);
            newSubmission.save(function (err, result) {
                if (err) {
                    console.log(err);
                    res.redirect("/prints/error");
                } else {
                    res.redirect("/prints/thankyou");
                }
            });
        }
    );

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
        printHandler.deleteFile(fileID);
        var result = await printRequestModel.findOne({
            "files._id": fileID,
        });

        //delete stl from disk
        var thisSTLPath = path.join(stlPath, result.files.id(fileID).fileName);
        try {
            fs.unlinkSync(thisSTLPath);
        } catch (error) {
            console.error("there was an error:", error.message);
        }

        //delete gcode from disk if it exists

        if (result.files.id(fileID).review.gcodeName) {
            var thisGcodePath = path.join(
                gcodePath,
                result.files.id(fileID).gcodeName
            );
            try {
                fs.unlinkSync(thisGcodePath);
            } catch (error) {
                console.error("there was an error:", error.message);
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
    app.post("/prints/waive", isLoggedIn, function (req, res, next) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        printHandler.recievePayment(
            submissionID,
            true,
            req.user.local.euid,
            function callback() {
                res.json(["done"]); //tell the front end the request is done
            }
        );
    });

    app.post("/prints/waiveByFile", isLoggedIn, function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        printHandler.recievePaymentByFile(
            fileID,
            true,
            req.user.local.euid,
            function callback() {
                res.json(["done"]); //tell the front end the request is done
            }
        );
    });

    app.post("/prints/requestwaive", isLoggedIn, function (req, res, next) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.addWaive(submissionID, "print");
        res.json(["done"]); //tell the front end the request is done
    });

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
    app.post(
        "/prints/singleReview",
        multer({
            storage: multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, path.join(__dirname, "../../Uploads/Gcode/"));
                },

                // By default, multer removes file extensions so let's add them back
                filename: function (req, file, cb) {
                    cb(
                        null,
                        Date.now() +
                            "-" +
                            file.originalname.split(".")[0] +
                            path.extname(file.originalname)
                    );
                },
            }),
        }).any(),
        isLoggedIn,
        function (req, res) {
            printHandler.updateSingle(req, function () {
                //send all the stuff to the submission handler
                res.redirect("/prints/new"); //when we are done tell the review page it's okay to reload now
            });
        }
    );

    app.post("/prints/appendNotes", isLoggedIn, function (req, res) {
        printHandler.appendNotes(req);
        res.redirect("back");
    });

    app.post("/prints/arrived", isLoggedIn, async function (req, res) {
        var now = new Date();
        var thisSubmission = await printRequestModel.findOne({
            "files._id": req.body.fileID,
        });

        var thisFile = thisSubmission.files.id(req.body.fileID);

        thisFile.isInTransit = false;
        thisFile.isWaitingForPickup = true;
        thisFile.timestampArrivedAtPickup = now;

        await thisSubmission.save();
        res.redirect("/prints/preview?fileID=" + req.body.fileID);
    });

    //-----------------------CHANGE LOCATION-----------------------
    //simple change location without reviewing
    app.post("/prints/changeLocation", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (
                        result.files.id(fileID).printLocation ==
                        "Willis Library"
                    ) {
                        result.files.id(fileID).printLocation =
                            "Discovery Park";
                    } else {
                        result.files.id(fileID).printLocation =
                            "Willis Library";
                    }
                    result.save();
                }
            }
        );
        res.json(["done"]);
    });

    //-----------------------SEND PAYMENT EMAIL-----------------------
    app.post("/prints/requestPayment", isLoggedIn, function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        printHandler.requestPayment(submissionID, function callback() {
            res.json(["done"]); //tell the front end the request is done
        });
    });

    //-----------------------HANDLE PAYMENT INCOME-----------------------
    app.post("/prints/recievePayment", isLoggedIn, function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        printHandler.recievePayment(
            submissionID,
            false,
            "",
            function callback() {
                res.json(["done"]); //tell the front end the request is done
            }
        );
    });

    //-----------------------CLEAR ALL COMPLETED PRINTS-----------------------
    app.post("/prints/clearAllCompleted", isLoggedIn, function (req, res) {
        printHandler.clearAllCompleted(function callback() {
            res.json("done");
        });
    });

    //-----------------------CLEAR ALL REJECTED PRINTS-----------------------
    app.post("/prints/clearAllRejected", isLoggedIn, function (req, res) {
        printHandler.clearAllRejected(function callback() {
            res.json("done");
        });
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
