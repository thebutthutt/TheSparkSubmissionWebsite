var printRequestModel = require('./models/printRequest');
const formidable = require('formidable');
const moment = require('moment');
const fs = require('fs');
const constants = require('../config/constants');
const payment = require('../config/payment.js');

module.exports = {
    //function receives the input from filled out request form and saves to the database
    addPrint: function (fields, prints) {
        console.log('in add print');

        var request = new printRequestModel(); //new instance of a request
        //fill the patron details
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
        }

        request.dateSubmitted = prints[7]; //always the date submitted
        request.numFiles = prints[8]; //always the number of files

        //set intitial parameters of the printRequest schema
        request.allFilesReviewed = false;
        request.hasNew = true;
        request.hasPendingPayment = false;
        request.hasReadyToPrint = false;
        request.hasRejected = false;
        request.hasAccepted = false;
        request.hasReadyForPickup = false;
        request.hasStaleOnPayment = false;
        request.hasStaleOnPickup = false;

        //loop through the arrays of file details possibly more than one file
        for (let i = 0; i < prints[0].length; i++) {
            request.files.push({
                fileName: prints[0][i],
                material: prints[1][i],
                infill: prints[2][i],
                color: prints[3][i],
                copies: prints[4][i],
                notes: prints[6][i],
                printLocation: prints[5][i],
                pickupLocation: prints[5][i],
                isReviewed: false,
                isRejected: false,
                isPaid: false,
                isPrinted: false,
                isPickedUp: false,
                dateSubmitted: prints[7], //always holds the date submitted
                dateReviewed: "Never",
                datePaid: "Never",
                datePrinted: "Never",
                datePickedUp: "Never"
            });
        }

        //save the top level submission and low level files to the database
        console.log('saving print');

        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            }
        });

    },

    //handles the data for a new top level print request with possibly multiple low level file submissions
    handleSubmission: function (req) {
        console.log('handling print');
        //arrays of each files specifications (will only hold one entry each if patron submits only one file)
        var filenames = [],
            materials = [],
            infills = [],
            colors = [],
            copies = [],
            notes = [],
            pickups = [],
            prints = [],
            patron = [],
            numFiles = 0,
            time = moment(),
            unique = 1;
        //get the incoming form data
        new formidable.IncomingForm().parse(req, function (err, fields, files) {
                patron = fields; //put the fields data into the patron container to send to the database function
                // add all our lists to one list to pass to the submission handler
                prints.push(filenames);
                prints.push(materials);
                prints.push(infills);
                prints.push(colors);
                prints.push(copies);
                prints.push(pickups);
                prints.push(notes);
                prints.push(time.format(constants.format));
                prints.push(numFiles);
                console.log('adding print');
                module.exports.addPrint(patron, prints);
            }).on('field', function (name, field) { //when a new field comes through
                //handling duplicate input names cause for some reason formidable doesnt do it yet...
                //makes arrays of all the duplicate form names
                if (name == 'material') {
                    materials.push(field);
                } else if (name == 'infill') {
                    infills.push(field);
                } else if (name == 'color') {
                    colors.push(field);
                } else if (name == 'copies') {
                    copies.push(field);
                } else if (name == 'pickup') {
                    pickups.push(field);
                } else if (name == 'notes') {
                    notes.push(field);
                }
            })
            .on('fileBegin', (name, file) => { //when a new file comes through
                file.name = time.unix() + unique + "%$%$%" + file.name; //add special separater so we can get just the filename later
                //yes this is a dumb way to keep track of the original filename but I dont care
                unique += 1; //increment unique so every file is not the same name
                file.path = __dirname + '/uploads/' + file.name;
            })
            .on('file', (name, file) => { //when a file finishes coming through
                console.log('Uploaded file', file.path); //make sure we got it
                filenames.push(file.path); //add this files path to the list of filenames
                numFiles++; //increment the number of files this top level submission is holding
            });
    },

    //this function handles when a technician is reviewing a print file within a top level submission
    updateSingle: function (req, callback) {
        var gcode;
        var time = moment();
        var shouldUpload = true;
        //get the incoming form data
        new formidable.IncomingForm().parse(req, function (err, fields, files) {
                printRequestModel.findOne({
                    'files._id': fields.fileID
                }, function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (result.files.id(fields.fileID).gcodeName != null) {
                            //delete gcode from disk if it exists
                            console.log("Submission had old GCODE file! deleting...");
                            fs.unlink(result.files.id(fields.fileID).gcodeName, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    }
                });
                //update the low level print according to the form data
                if (fields.decision == 'accepted') { //if the technician accepted the print, update accordingly
                    printRequestModel.findOneAndUpdate({
                        'files._id': fields.fileID
                    }, {
                        "$set": {
                            "files.$.gcodeName": gcode,
                            "files.$.slicedPrinter": fields.printer,
                            "files.$.slicedMaterial": fields.material,
                            "files.$.timeHours": fields.hours,
                            "files.$.timeMinutes": fields.minutes,
                            "files.$.grams": fields.grams,
                            "files.$.techNotes": fields.technotes,
                            "files.$.printLocation": fields.printLocation,
                            "files.$.isReviewed": true,
                            "files.$.isRejected": false,
                            "files.$.dateReviewed": time.format(constants.format),
                        }
                    }, {
                        new: true
                    }, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        //console.log(result);
                    });
                } else { //the tecnicican rejected the print, so update differently
                    printRequestModel.findOneAndUpdate({
                        'files._id': fields.fileID
                    }, {
                        "$set": {
                            "files.$.isReviewed": true,
                            "files.$.isRejected": true,
                            "files.$.dateReviewed": time.format(constants.format),
                            "files.$.rejectedNotes": fields.patronNotes,
                        }
                    }, {
                        new: true
                    }, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        //console.log(result);
                    });
                }

                //now find the fully updated top level submission so we can check if all the files have been reviewed
                module.exports.setFlags(fields.fileID);

                if (typeof callback == 'function') {
                    callback(); //running the callback specified in calling function (in routes.js)
                }

            }).on('field', (name, field) => { //if we should be looking for a file uploaded for GCODE
                if (name == "decision") {
                    if (field == "accepted") {
                        shouldUpload = true;
                    } else {
                        shouldUpload = false;
                    }
                }
            })
            .on('fileBegin', (name, file) => { //handle uploading a file if needed
                if (shouldUpload) {
                    console.log(file.name);
                    file.name = time.unix() + "%$%$%" + file.name; //add special separater so we can get just the filename later
                    file.path = __dirname + '/uploads/gcode/' + file.name;
                    console.log('uploaded gcode');
                } else {
                    console.log('file was null');
                }
            }).on('file', (name, file) => { //when a file finishes coming through
                if (shouldUpload) {
                    gcode = file.path;
                    console.log(gcode);
                }

            }).on('end', function () {
                console.log('ended');
            });

    },

    //this function fires when a tech says a submission is ready to be sent to the pendpay queue
    //eventually will ask for payment from a patron
    requestPayment: function (submissionID, callback) {
        //somwhow request the payment for only the accepted prints
        var time = moment();
        printRequestModel.findOne({
            "_id": submissionID
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                //only ask for payment if there were any files accepted
                if (result.hasAccepted) {
                    //request payment here
                    result.hasNew = false; //submission wont be in new queue
                    result.hasPendingPayment = true; //submission will be in pendpay queue
                    result.datePaymentRequested = time.format(constants.format);
                    var nameString = result.patron.fname;
                    nameString.concat("+");
                    nameString.concat(result.patron.lname);
                    console.log(nameString);
                    payment.generatePaymentURL("hanna_flores", 12.6, result._id);
                } else { //dont ask for payment, just move to the rejected queue
                    //none of the prints were accepted
                    result.hasNew = false; //submission not in new queue
                    result.datePaymentRequested = time.format(constants.format); //still capture review time
                }
                result.save();
                if (typeof callback == 'function') {
                    callback();
                }
            }
        });

    },

    //should fire when a user pays for a submission
    //pushes print from the pendpy queue to the paid and ready queue
    recievePayment: function (submissionID, callback) {
        var time = moment();
        printRequestModel.findOne({
            "_id": submissionID
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                //this check is redundant but still
                if (result.hasAccepted) { //if there were any accepted files
                    result.hasReadyToPrint = true; //now we have files ready to print
                    result.hasPendingPayment = false; //submission will be in pendpay queue
                    result.datePaid = time.format(constants.format);
                    for (var i = 0; i < result.files.length; i++) {
                        result.files[i].datePaid = time.format(constants.format);
                    }
                } else { //would never happen but just in case
                    //none of the prints were accepted
                    result.hasPendingPayment = false; //submission not in new queue
                }
                result.save(); //save the db entry
                if (typeof callback == 'function') {
                    console.log('firing callback');
                    callback();
                }
            }
        });

    },

    //set appropriate flags for top level submission
    setFlags: function (submissionID) {
        printRequestModel.findOne({
            'files._id': submissionID
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                var numFiles = result.numFiles;
                var numReviewed = 0,
                    numRejected = 0;
                var hasRejected = false;

                //count number of reviewed files and see if any are rejected
                for (var i = 0; i < result.files.length; i++) {
                    if (result.files[i].isReviewed == true) {
                        numReviewed += 1;
                    }

                    if (result.files[i].isRejected == true) {
                        hasRejected = true;
                        numRejected++;
                    }
                }

                result.hasRejected = hasRejected; //update if the top level contains a rejected file
                if (numRejected == numFiles) {
                    result.hasAccepted = false;
                } else if (numReviewed > 0) { //if at least one is reviewed and we know not all are rejected
                    result.hasAccepted = true;
                }

                //if they are the same we can allow the top level submission to be processed
                if (numReviewed == numFiles) {
                    result.allFilesReviewed = true;
                    result.save();
                } else if (numReviewed > numFiles) { //this should never happen, log the error
                    console.log("something is very wrong. numFiles: ", numFiles, " numReviewed: ", numReviewed);
                } else { //else the numreviewed is less than numfiles which is fine and normal
                    result.save();
                }
            }
        });
    },

    deleteFile: function (fileID) {
        printRequestModel.findOne({ //find top level print request by single file ID
            'files._id': fileID
        }, function (err, result) {
            //delete stl from disk
            fs.unlink(result.files.id(fileID).fileName, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            if (result.files.id(fileID).isRejected == false) {
                //delete gcode from disk if it exists
                if (result.files.id(fileID).gcodeName != null) {
                    console.log(result.files.id(fileID).gcodeName);
                    fs.unlink(result.files.id(fileID).gcodeName, function (err) {
                        if (err) {
                            console.log("gcode delete", err);
                        }
                    });
                }
            }
            result.files.id(fileID).remove(); //remove the single file from the top level print submission
            result.numFiles -= 1; //decrement number of files associated with this print request
            if (result.numFiles < 1) { //if no more files in this request delete the request itself
                printRequestModel.deleteOne({
                    '_id': result._id
                }, function (err) { //delete top level request
                    if (err) console.log(err);
                    console.log("Successful deletion");
                });
            } else { //else save the top level with one less file
                result.save(function (err) { //save top level request db entry
                    if (err) console.log(err);
                    console.log("Successful deletion");
                });
                module.exports.setFlags(result.files[0]._id); //now set all the flags of the updated top level submission
            }

        });
    }
}