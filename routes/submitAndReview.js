var multer = require("multer");
var path = require("path");
var printRequestModel = require("../app/models/newPrintRequest.js");
const NodeStl = require("node-stl");

module.exports = function (app) {
    /* -------------------------------------------------------------------------- */
    /*                          Submit New Print Request                          */
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
    /*                           Review One Request File                          */
    /* -------------------------------------------------------------------------- */

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
        async function (req, res) {
            var now = new Date();
            var shouldUpload = false;
            if (req.files[0]) {
                var realGcodeName = req.files[0].filename;
                var gcode = req.files[0].originalname;
                shouldUpload = true;
            }
            var maker = req.user.name;
            var id = req.body.fileID;
            var result = await printRequestModel.findOne({
                "files._id": req.body.fileID,
            });

            var fileName = result.files.id(id).fileName;
            var allFilesReviewed = true;

            for (var thisFile of result.files) {
                if (thisFile.fileName == fileName) {
                    thisFile.review.patronNotes = req.body.patronNotes;
                    thisFile.review.reviewedBy = maker;
                    thisFile.review.timestampReviewed = now;
                    thisFile.status = "REVIEWED";
                    var newNoteObject = {
                        techName: maker,
                        dateAdded: now,
                        notes: req.body.technotes,
                    };
                    thisFile.review.internalNotes.push(newNoteObject);
                    if (req.body.decision == "accepted") {
                        thisFile.review.descision = "Accepted";
                        if (shouldUpload) {
                            thisFile.review.originalGcodeName = gcode;
                            thisFile.review.gcodeName = realGcodeName;
                        }

                        thisFile.review.slicedPrinter = req.body.printer;
                        thisFile.review.slicedMaterial = req.body.material;
                        thisFile.review.slicedHours = req.body.hours;
                        thisFile.review.slicedMinutes = req.body.minutes;
                        thisFile.review.slicedGrams = req.body.grams;
                        thisFile.review.printLocation = req.body.printLocation;
                    } else {
                        thisFile.review.descision = "Rejected";
                    }
                }
                if (thisFile.status != "REVIEWED") {
                    allFilesReviewed = false;
                }
            }
            result.allFilesReviewed = allFilesReviewed;
            await result.save();

            res.redirect("/prints/new");
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
