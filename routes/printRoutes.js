var multer = require("multer");
var path = require("path");
var numPerPage = 10;
var gcodePath = path.join(__dirname, "..", "..", "Uploads", "Gcode");
var stlPath = path.join(__dirname, "..", "..", "Uploads", "STLs");
var printRequestModel = require("../app/models/printRequest");
var printHandler = require("../handlers/printHandler.js");
var adminRequestHandler = require("../handlers/adminRequestHandler.js");
var payment = require("../app/payment.js");
const archiver = require("archiver");
var fs = require("fs");

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

    //-----------------------NEW PRINTS-----------------------
    // show the new prints queue
    app.get("/prints/new", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isNewSubmission", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //prints
                    dbdata: data,
                    printPage: "newSub",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //-----------------------REVIEW FILE----------------------------

    //send technician to reveiw page for a specific low level print file
    app.get("/prints/preview", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printRequestModel.findOne(
            {
                //find the top level submission from the low level file id
                "files._id": fileID,
            },
            function (err, result) {
                var finalGcode = "";
                if (result.files.id(fileID).gcodeName) {
                    finalGcode = path.join(
                        gcodePath,
                        result.files.id(fileID).gcodeName
                    );
                }
                res.render("pages/prints/previewPrint", {
                    //render the review page
                    pgnum: 4, //prints  `
                    isAdmin: true,
                    timestamp: fileID.dateSubmitted,
                    isSuperAdmin: req.user.isSuperAdmin,
                    name: req.user.name,
                    print: result.files.id(fileID), //send the review page the file to review
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

    //-----------------------PENDING PAYMENT-----------------------

    //show pending payment prints
    app.get("/prints/pendpay", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$item.isPendingPayment",
                                                true,
                                            ],
                                        },
                                        {
                                            $ne: [
                                                "$$item.isStaleOnPayment",
                                                true,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                console.log(data);
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //prints
                    dbdata: data,
                    printPage: "pendpay",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show pending payment prints
    app.get("/prints/pendpaystale", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isStaleOnPayment", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //prints
                    dbdata: data,
                    printPage: "pendpaystale",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //-------------READY TO PRINT------------------------

    //show pready to print all locations
    app.get("/prints/ready", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: { $eq: ["$$item.isReadyToPrint", true] },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "ready",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show ready to print at willis
    app.get("/prints/readywillis", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$item.isReadyToPrint",
                                                true,
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.printLocation",
                                                "Willis Library",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "ready",
                    location: "Willis Library",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show ready to print at dp
    app.get("/prints/readydp", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$item.isReadyToPrint",
                                                true,
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.printLocation",
                                                "Discovery Park",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "ready",
                    location: "Discovery Park",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/intransit", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: { $eq: ["$$item.isInTransit", true] },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "inTransit",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
        /**
        printRequestModel.find(
            {
                "files.isInTransit": true,
            },
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "inTransit",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
         */
    });

    //---------------PICKUP-----------------------------------

    //show pickup all locations
    app.get("/prints/pickup", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: ["$$item.isPrinted", true],
                                        },
                                        {
                                            $eq: ["$$item.isPickedUp", false],
                                        },
                                        {
                                            $eq: [
                                                "$$item.isStaleOnPickup",
                                                false,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "pickup",
                    location: "all",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show pickup at willis
    app.get("/prints/pickupwillis", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: ["$$item.isPrinted", true],
                                        },
                                        {
                                            $eq: ["$$item.isPickedUp", false],
                                        },
                                        {
                                            $eq: [
                                                "$$item.pickupLocation",
                                                "Willis Library",
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.isStaleOnPickup",
                                                false,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "pickup",
                    location: "Willis Library",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //show pickip at dp
    app.get("/prints/pickupdp", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $and: [
                                        {
                                            $eq: ["$$item.isPrinted", true],
                                        },
                                        {
                                            $eq: ["$$item.isPickedUp", false],
                                        },
                                        {
                                            $eq: [
                                                "$$item.pickupLocation",
                                                "Discovery Park",
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$item.isStaleOnPickup",
                                                false,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "pickup",
                    location: "Discovery Park",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/prints/completed", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isPickedUp", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "completed",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //-----------------------REJECTED-----------------------
    app.get("/prints/rejected", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages
        printRequestModel.aggregate(
            [
                {
                    $set: {
                        files: {
                            $filter: {
                                input: "$files",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.isRejected", true],
                                },
                            },
                        },
                    },
                },
                { $match: { "files.0": { $exists: true } } },
            ],
            function (err, data) {
                //loading every single top level request FOR NOW
                res.render("pages/prints/allPrints", {
                    pgnum: 4, //tells the navbar what page to highlight
                    dbdata: data,
                    printPage: "rejected",
                    location: "willis",
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    //-----------------------ALL-----------------------
    app.get("/prints/all", isLoggedIn, function (req, res) {
        //load the submission page and flash any messages

        printRequestModel.find({}, function (err, data) {
            //loading every single top level request FOR NOW
            res.render("pages/prints/allPrints", {
                pgnum: 4, //tells the navbar what page to highlight
                dbdata: data,
                printPage: "all",
                isAdmin: true,
                isSuperAdmin: req.user.isSuperAdmin,
            });
        });
    });

    app.get("/prints/allp", isLoggedIn, async function (req, res) {
        //load the submission page and flash any messages
        var page = req.query.page;
        var skip = (page - 1) * numPerPage;
        var submissions = await printRequestModel
            .find({})
            .skip(skip)
            .limit(numPerPage);

        res.render("pages/prints/allPrints", {
            pgnum: 4, //tells the navbar what page to highlight
            dbdata: submissions,
            printPage: "all",
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
        });
    });

    //-----------------------LANDING AFTER PAYMENT-----------------------
    //displays to the user once they sucesfully submit payment through 3rd party service
    app.get("/payment/complete", function (req, res) {
        var admin = false,
            superAdmin = false;
        if (req.isAuthenticated()) {
            admin = true;
            if (req.user.isSuperAdmin == true) {
                isSuperAdmin = true;
            }
        }
        payment.handlePaymentComplete(req, function (success, submissionID) {
            //tell the payment handler to update our databases
            if (success == true) {
                printHandler.recievePayment(
                    submissionID,
                    false,
                    "",
                    function callback() {}
                );
                res.render("pages/prints/thankyoupayment", {
                    //render the success page
                    data: req.query,
                    pgnum: 0,
                    isAdmin: admin,
                    isSuperAdmin: superAdmin,
                });
            } else {
                console.log("invalid payment URL");
            }
        });
    });

    //-----------------------DELETE FILE-----------------------
    //deletes a database entry and asscoiated files
    app.post("/prints/delete", isLoggedIn, function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        printHandler.deleteFile(fileID);
        res.json(["done"]); //tell the front end the request is done
    });

    //request superadmin to delete
    app.post("/prints/requestdelete", isLoggedIn, function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        adminRequestHandler.addDelete(fileID, "print");
        res.json(["done"]); //tell the front end the request is done
    });

    //undo request SU delete
    app.post("/prints/undodelete", isLoggedIn, function (req, res, next) {
        var fileID = req.body.fileID || req.query.fileID;
        adminRequestHandler.undoDelete(fileID, "print");
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

    //-----------------------MARK COMPLETED-----------------------
    app.post("/prints/finishPrinting", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printHandler.markCompleted(fileID);
        res.json(["done"]);
    });

    //-----------------------MARK PICKEFD UP-----------------------
    app.post("/prints/markPickedUp", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printHandler.markPickedUp(fileID);
        res.json(["done"]);
    });

    //-----------------------DOWNLOAD-----------------------
    //downloads file specified in the parameter
    app.get("/prints/download", isLoggedIn, function (req, res) {
        var fileLocation = req.body.fileID || req.query.fileID;
        console.log(fileLocation);

        var newLocation;
        if (fileLocation.slice(-5).toUpperCase() == "GCODE") {
            newLocation = path.join(gcodePath, fileLocation);
        } else {
            newLocation = path.join(stlPath, fileLocation);
        }

        console.log(newLocation);
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

    //-----------------------START PRINT-----------------------
    app.post("/prints/startprint", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printHandler.startPrint(fileID, function callback() {
            res.json(["done"]);
        });
    });

    app.post("/prints/markPrinting", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        var copiesPrinting =
            req.body.copiesPrinting || req.query.copiesPrinting;
        printHandler.markPrinting(fileID, copiesPrinting, function callback() {
            res.json(["done"]);
        });
    });

    app.post("/prints/changeCopies", isLoggedIn, function (req, res) {
        console.log(req.body);
        console.log(req.query);
        var fileID = req.body.fileID || req.query.fileID;
        var copiesPrinting =
            req.body.copiesPrinting || req.query.copiesPrinting;
        var copiesPrinted = req.body.copiesPrinted || req.query.copiesPrinted;
        printHandler.changePrintCopyStatus(
            fileID,
            copiesPrinting,
            copiesPrinted,
            function callback() {
                res.json(["done"]);
            }
        );
    });

    //-----------------------PRINT SUCCESS-----------------------
    app.post("/prints/printsuccess", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        var copiesPrinting =
            req.body.copiesPrinting || req.query.copiesPrinting;

        printHandler.printSuccess(fileID, copiesPrinting, function callback() {
            res.json(["done"]);
        });
    });

    app.post("/prints/printcomplete", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        var realGrams = req.body.realGrams || req.query.realGrams;
        printHandler.printCompleted(fileID, realGrams, function callback() {
            res.json(["done"]);
        });
    });

    app.post("/prints/printfinish", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        var numCopies = req.body.numCopies || req.query.numCopies;
        var weight = req.body.weight || req.query.weight;
        var location = req.body.location || req.query.location;
        console.log(numCopies, weight, location);
        printHandler.printFinished(
            fileID,
            numCopies,
            weight,
            location,
            function callback() {
                res.redirect("/prints/preview?fileID=" + fileID);
            }
        );
    });

    //-----------------------PRINT FAIL-----------------------
    app.post("/prints/printfail", isLoggedIn, function (req, res) {
        var fileID = req.body.fileID || req.query.fileID;
        printHandler.printFail(fileID, function callback() {
            res.json(["done"]);
        });
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
