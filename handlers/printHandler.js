/** @format */

const moment = require("moment");
const constants = require("../config/constants");
var payment = require("../config/payment.js");
var newmailer = require("../config/emailer.js");
var fs = require("fs");
var path = require("path");
var printRequestModel = require("../app/models/printRequest");

var gcodePath = path.join(__dirname, "..", "..", "Uploads", "Gcode");
var stlPath = path.join(__dirname, "..", "..", "Uploads", "STLs");

module.exports = {
    //return the number of new prints in the queue
    metaInfo: function () {},

    //function receives the input from filled out request form and saves to the database
    addPrint: function (fields, prints) {
        var request = new printRequestModel(); //new instance of a request
        //fill the patron details
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
            phone: fields.phone,
        };

        request.dateSubmitted = prints[8]; //always the date submitted
        request.numFiles = prints[9]; //always the number of files

        //set intitial parameters of the printRequest schema
        request.allFilesReviewed = false;
        request.hasStaleOnPayment = false;
        request.hasStaleOnPickup = false;
        request.isPendingDelete = false;

        //loop through the arrays of file details possibly more than one file
        for (let i = 0; i < prints[0].length; i++) {
            request.files.push({
                fileName: prints[0][i],
                realFileName: prints[1][i],
                material: prints[2][i],
                infill: prints[3][i],
                color: prints[4][i],
                copies: prints[5][i],
                notes: prints[7][i],
                printLocation: prints[6][i],
                pickupLocation: prints[6][i],

                isNewSubmission: true,
                isReviewed: false,
                isRejected: false,
                isPendingPayment: false,
                isPendingWaive: false,
                isPaid: false,
                isReadyToPrint: false,
                isPrinted: false,
                isPickedUp: false,
                isPendingDelete: false,
                canBeReviewed: true,
                isStarted: false,
                isStaleOnPickup: false,

                dateSubmitted: prints[8], //always holds the date submitted
                dateReviewed: "Never",
                datePaid: "Never",
                datePrinted: "Never",
                datePickedUp: "Never",
                dateOfFirstWarning: "Not yet sent",
                dateOfSecondWarning: "Not yet sent",
                dateOfConfiscation: "Not yet sent",

                numAttempts: 0,
                numFailedAttempts: 0,

                overrideNotes: "",
            });
        }

        //save the top level submission and low level files to the database

        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            } else {
                newmailer.newSubmission(request);
            }
        });
    },

    //handles the data for a new top level print request with possibly multiple low level file submissions
    handleSubmission: function (req, callback) {
        //arrays of each files specifications (will only hold one entry each if patron submits only one file)
        console.log(req.files);
        var filenames = [],
            realFileNames = [],
            materials = Array.isArray(req.body.material) ? req.body.material : Array.of(req.body.material),
            infills = Array.isArray(req.body.infill) ? req.body.infill : Array.of(req.body.infill),
            colors = Array.isArray(req.body.color) ? req.body.color : Array.of(req.body.color),
            copies = Array.isArray(req.body.copies) ? req.body.copies : Array.of(req.body.copies),
            notes = Array.isArray(req.body.notes) ? req.body.notes : Array.of(req.body.notes),
            pickups = Array.isArray(req.body.pickup) ? req.body.pickup : Array.of(req.body.pickup),
            prints = [],
            patron = {
                first: req.body.first,
                last: req.body.last,
                email: req.body.email,
                euid: req.body.euid,
                phone: req.body.phone,
            },
            numFiles = req.files.length,
            time = moment();
        if (numFiles <= 0) {
            //bad
            callback("failure");
        } else {
            req.files.forEach(function (file) {
                filenames.push(file.filename);
                realFileNames.push(file.originalname);
            });
            prints.push(filenames);
            prints.push(realFileNames);
            prints.push(materials);
            prints.push(infills);
            prints.push(colors);
            prints.push(copies);
            prints.push(pickups);
            prints.push(notes);
            prints.push(time.format(constants.format));
            prints.push(numFiles);

            module.exports.addPrint(patron, prints);
            callback("success"); //tell calling function we got it
        }
    },

    //this function handles when a technician is reviewing a print file within a top level submission
    updateSingle: function (req, callback) {
        var time = moment();
        var shouldUpload = false;
        if (req.files[0]) {
            var gcode = req.files[0].filename;
            var realGcodeName = req.files[0].originalname;
            shouldUpload = true;
        }
        var maker = req.user.name;
        var id = req.body.fileID;

        printRequestModel.findOne(
            {
                "files._id": req.body.fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (result.files.id(id).gcodeName != null) {
                        //delete gcode from disk if it exists
                        console.log("Submission had old GCODE file! deleting...");
                        var thisGcodePath = path.join(gcodePath, result.files.id(req.body.fileID).gcodeName);
                        fs.unlink(thisGcodePath, function (err) {
                            if (err.code === "ENOENT") {
                                console.log("File not found!");
                            } else {
                                throw err;
                            }
                        });
                    }
                }
            }
        );
        //update the low level print according to the form data
        if (req.body.decision == "accepted") {
            //if the technician accepted the print, update accordingly
            printRequestModel.findOneAndUpdate(
                {
                    "files._id": req.body.fileID,
                },
                {
                    $set: {
                        "files.$.gcodeName": gcode,
                        "files.$.realGcodeName": realGcodeName,
                        "files.$.slicedPrinter": req.body.printer,
                        "files.$.slicedMaterial": req.body.material,
                        "files.$.timeHours": req.body.hours,
                        "files.$.timeMinutes": req.body.minutes,
                        "files.$.grams": req.body.grams,
                        "files.$.patronNotes": req.body.patronNotes,
                        "files.$.techNotes": req.body.technotes,
                        "files.$.approvedBy": maker,
                        "files.$.printLocation": req.body.printLocation,
                        "files.$.isReviewed": true,
                        "files.$.isRejected": false,
                        "files.$.dateReviewed": time.format(constants.format),
                    },
                },
                {
                    new: true,
                },
                function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(result);
                    //now find the fully updated top level submission so we can check if all the files have been reviewed
                    module.exports.setFlags(id, function () {
                        callback();
                    });
                }
            );
        } else {
            //the tecnicican rejected the print, so update differently
            printRequestModel.findOneAndUpdate(
                {
                    "files._id": req.body.fileID,
                },
                {
                    $set: {
                        "files.$.isReviewed": true,
                        "files.$.isRejected": true,
                        "files.$.isPendingPayment": false,
                        "files.$.dateReviewed": time.format(constants.format),
                        "files.$.approvedBy": maker,
                        "files.$.patronNotes": req.body.patronNotes,
                    },
                },
                {
                    new: true,
                },
                function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(result);
                    //now find the fully updated top level submission so we can check if all the files have been reviewed
                    module.exports.setFlags(id, function () {
                        callback();
                    });
                }
            );
        }
    },

    //------------------------Add new technician notes without a full file review------------------------
    appendNotes: function (req) {
        printRequestModel.findOne(
            {
                "files._id": req.body.fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (req.body.newNotes != "") {
                        if (!result.files.id(req.body.fileID).techNotes) {
                            result.files.id(req.body.fileID).techNotes = "";
                        } else {
                            result.files.id(req.body.fileID).techNotes += "\n";
                        }

                        result.files.id(req.body.fileID).techNotes += req.body.name;
                        result.files.id(req.body.fileID).techNotes += ": ";
                        result.files.id(req.body.fileID).techNotes += req.body.newNotes;
                        result.save();
                    }
                }
            }
        );
    },

    //this function fires when a tech says a submission is ready to be sent to the pendpay queue
    requestPayment: function (submissionID, callback) {
        var time = moment();
        printRequestModel.findOne(
            {
                _id: submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //found the submission in the database, now calc payment and send the link to the email

                    var acceptedFiles = [],
                        rejectedFiles = [];

                    var email = result.patron.email;

                    //calculate paumet amount
                    var amount = 0.0;
                    for (var i = 0; i < result.files.length; i++) {
                        result.files[i].canBeReviewed = false;
                        result.files[i].isNewSubmission = false;

                        if (result.files[i].isRejected == false && result.files[i].isReviewed == true) {
                            //print is accepted
                            result.files[i].isPendingPayment = true;
                            if (result.files[i].timeHours <= 0 && result.files[i].timeMinutes <= 59) {
                                //if its less than an hour, just charge one dollar
                                var thisCopy = 1;
                                var allCopies = thisCopy * result.files[i].copies;
                                amount += allCopies;
                            } else {
                                //charge hours plus minutes out of 60 in cents
                                var thisCopy = result.files[i].timeHours;
                                thisCopy += result.files[i].timeMinutes / 60;
                                var allCopies = thisCopy * result.files[i].copies;
                                amount += allCopies;
                            }
                            acceptedFiles.push(result.files[i]._id);
                        } else {
                            rejectedFiles.push(result.files[i]._id);
                        }
                    }
                    amount = Math.round((amount + Number.EPSILON) * 100) / 100; //make it a normal 2 decimal place charge
                    amount = amount.toFixed(2); //correct formatting

                    //if the submission had any accepted files, we will ask for payment
                    if (acceptedFiles.length > 0) {
                        result.datePaymentRequested = time.format(constants.format);

                        //calc full name of patron
                        var nameString = "";
                        nameString = nameString.concat(result.patron.fname, " ", result.patron.lname);

                        /*//hand it to the payment handler to generate the url for the patron
                        payment.generatePaymentURL(
                            nameString,
                            email,
                            acceptedFiles,
                            acceptedMessages,
                            rejectedFiles,
                            rejectedMessages,
                            amount,
                            result._id
                        ); //generate the URL*/

                        payment.sendPaymentEmail(result, amount, rejectedFiles.length);
                    } else {
                        //dont ask for payment, just move to the rejected queue
                        //none of the prints were accepted
                        result.datePaymentRequested = time.format(constants.format); //still capture review time
                        newmailer.allRejected(result);
                    }

                    //save result to the database with updated flags
                    result.save();

                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    //should fire when a user pays for a submission
    //pushes print from the pendpy queue to the paid and ready queue
    recievePayment: function (submissionID, wasWaived, waivingEUID, callback) {
        var time = moment();
        printRequestModel.findOne(
            {
                _id: submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 0; i < result.files.length; i++) {
                        result.files[i].isPendingPayment = false;
                        if (result.files[i].isRejected == false) {
                            result.files[i].isPaid = true;
                            result.files[i].isReadyToPrint = true;
                            result.files[i].isPendingWaive = false;
                            if (wasWaived) {
                                result.files[i].overrideNotes = "Payment was waived by " + waivingEUID + "\n";
                            }
                        }
                    }
                    result.datePaid = time.format(constants.format);
                    if (wasWaived) {
                        //emailer.paymentWaived(result.patron.email);
                        newmailer.paymentWaived(result);
                    } else {
                        //emailer.readyToPrint(result.patron.email);
                        newmailer.paymentThankYou(result);
                    }

                    result.save(); //save the db entry
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    recievePaymentByFile: function (fileID, wasWaived, waivingEUID, callback) {
        var time = moment();
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 0; i < result.files.length; i++) {
                        result.files[i].isPendingPayment = false;
                        if (result.files[i].isRejected == false) {
                            result.files[i].isPaid = true;
                            result.files[i].isReadyToPrint = true;
                            result.files[i].isPendingWaive = false;
                            if (wasWaived) {
                                result.files[i].overrideNotes = "Payment was waived by " + waivingEUID + "\n";
                            }
                        }
                    }
                    result.datePaid = time.format(constants.format);
                    if (wasWaived) {
                        //emailer.paymentWaived(result.patron.email);
                        newmailer.paymentWaived(result);
                    } else {
                        //emailer.readyToPrint(result.patron.email);
                        newmailer.paymentThankYou(result);
                    }

                    result.save(); //save the db entry
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    //mark that a file has finished printing, this moves it to the piickup queue
    markCompleted: function (fileID, realGrams) {
        var time = moment();
        printRequestModel.findOneAndUpdate(
            {
                "files._id": fileID,
            },
            {
                $set: {
                    "files.$.isPrinted": true,
                    "files.$.datePrinted": time.format(constants.format),
                    "files.$.isReadyToPrint": false,
                    "files.$.realGrams": realGrams,
                },
            },
            {
                new: true,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                }
                module.exports.setFlags(fileID, function () {});
                //emailer.readyForPickup(result.patron.email, result.files.id(fileID).realFileName);
                newmailer.readyForPickup(result, result.files.id(fileID));
            }
        );
    },

    //park that a print has been started, adds an attempt
    startPrint: function (fileID, callback) {
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.files.id(fileID).isStarted = true;
                    if (result.files.id(fileID).numAttempts == null) {
                        result.files.id(fileID).numAttempts = 0;
                    }
                    result.files.id(fileID).numAttempts += 1;
                    result.save();
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    markPrinting: function (fileID, copiesPrinting, callback) {
        copiesPrinting = parseInt(copiesPrinting);
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.files.id(fileID).isStarted = true;
                    if (result.files.id(fileID).numAttempts == null) {
                        result.files.id(fileID).numAttempts = 0;
                    }
                    result.files.id(fileID).numAttempts += 1;

                    if (result.files.id(fileID).copiesPrinting == null) {
                        result.files.id(fileID).copiesPrinting = 0;
                    }
                    result.files.id(fileID).copiesPrinting += copiesPrinting;

                    result.save();
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    //mark that a print succeeded, this then calls mark completed
    printSuccess: function (fileID, copiesPrinting, callback) {
        copiesPrinting = parseInt(copiesPrinting);
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.files.id(fileID).isStarted = false;
                    if (result.files.id(fileID).copiesPrinted == null) {
                        result.files.id(fileID).copiesPrinted = 0;
                    }
                    result.files.id(fileID).copiesPrinted += copiesPrinting;
                    result.files.id(fileID).copiesPrinting = 0;
                    result.save();
                    //module.exports.markCompleted(fileID);
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    printCompleted: function (fileID, realGrams, callback) {
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    module.exports.markCompleted(fileID, realGrams);
                    console.log("here");
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    //accept the signature from the patron
    acceptSignature: function (fileID, fileName) {
        console.log("accepting signaature");
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //no more than one signature file for a print
                    /*if (result.files.id(fileID).isSigned == true && result.files.id(fileID).signaturePath != "") {
                        //already had a signature, usually on when debugging
                        fs.unlink(result.files.id(fileID).signaturePath, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }*/
                    result.files.id(fileID).isSigned = true;
                    //result.files.id(fileID).signaturePath = fileName;
                    result.save();
                    //module.exports.markPickedUp(fileID); //also mark it picked up
                }
            }
        );
    },

    //the print has been picked up by the patron
    markPickedUp: function (fileID) {
        console.log("was picked up");
        var time = moment().format(constants.format);
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.files.id(fileID).isPickedUp = true;
                    result.files.id(fileID).datePickedUp = time;
                    result.save();
                }
            }
        );
    },

    //notify that a print attempt has failed
    printFail: function (fileID, callback) {
        printRequestModel.findOne(
            {
                "files._id": fileID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.files.id(fileID).isStarted = false; //not started anymore
                    if (result.files.id(fileID).numFailedAttempts == null) {
                        result.files.id(fileID).numFailedAttempts = 0;
                    }
                    result.files.id(fileID).numFailedAttempts += 1; //add a failed attempt

                    result.files.id(fileID).copiesPrinting = 0;
                    result.save();
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        );
    },

    //remove all the completed files from the disk
    clearAllCompleted: function (callback) {
        printRequestModel.find(
            {
                "files.isPickedUp": true,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //find every completed file in every submission containing one
                    result.forEach((submission) => {
                        submission.files.forEach((file) => {
                            if (file.isPickedUp == true) {
                                module.exports.deleteFile(file._id); //and tell the delete method about it
                            }
                        });
                    });
                }
            }
        );

        //tell the calling function when we finish
        if (typeof callback == "function") {
            callback();
        }
    },

    //clear all rejected files
    clearAllRejected: function (callback) {
        printRequestModel.find(
            {
                "files.isRejected": true,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //find every rejected file in every submission containing one
                    result.forEach((submission) => {
                        submission.files.forEach((file) => {
                            if (file.isRejected == true) {
                                module.exports.deleteFile(file._id); //and tell the delete method about it
                            }
                        });
                    });
                }
            }
        );

        //tell the calling function when we finish
        if (typeof callback == "function") {
            callback();
        }
    },

    //set appropriate flags for top level submission
    setFlags: function (submissionID, callback) {
        printRequestModel.findOne(
            {
                "files._id": submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    var numFiles = result.numFiles;
                    var numReviewed = 0;

                    //count number of reviewed files and see if any are rejected
                    for (var i = 0; i < result.files.length; i++) {
                        if (result.files[i].isReviewed == true) {
                            numReviewed += 1;
                        }
                    }

                    //if they are the same we can allow the top level submission to be processed
                    if (numReviewed == numFiles) {
                        result.allFilesReviewed = true;
                    }

                    result.save();
                    callback();
                }
            }
        );
    },

    //delete the file from the disk
    deleteFile: function (fileID) {
        printRequestModel.findOne(
            {
                //find top level print request by single file ID
                "files._id": fileID,
            },
            function (err, result) {
                //delete stl from disk
                var thisSTLPath = path.join(stlPath, result.files.id(fileID).fileName);
                fs.unlink(thisSTLPath, function (err) {
                    if (err) {
                        if (err.code === "ENOENT") {
                            console.log("File not found!");
                        } else {
                            throw err;
                        }
                    }
                });

                //delete gcode from disk if it exists

                if (result.files.id(fileID).gcodeName) {
                    var thisGcodePath = path.join(gcodePath, result.files.id(fileID).gcodeName);
                    fs.unlink(thisGcodePath, function (err) {
                        if (err) {
                            if (err.code === "ENOENT") {
                                console.log("File not found!");
                            } else {
                                throw err;
                            }
                        }
                    });
                }

                //delete signature if it exists
                if (result.files.id(fileID).signaturePath != null && result.files.id(fileID).signaturePath != "") {
                    fs.unlink(result.files.id(fileID).signaturePath, function (err) {
                        if (err.code === "ENOENT") {
                            console.log("File not found!");
                        } else {
                            throw err;
                        }
                    });
                }

                result.files.id(fileID).remove(); //remove the single file from the top level print submission
                result.numFiles -= 1; //decrement number of files associated with this print request
                if (result.numFiles < 1) {
                    //if no more files in this request delete the request itself
                    printRequestModel.deleteOne(
                        {
                            _id: result._id,
                        },
                        function (err) {
                            //delete top level request
                            if (err) console.log(err);
                        }
                    );
                } else {
                    //else save the top level with one less file
                    result.save(function (err) {
                        //save top level request db entry
                        if (err) console.log(err);
                    });
                    module.exports.setFlags(result.files[0]._id, function () {}); //now set all the flags of the updated top level submission
                }
            }
        );
    },
};
