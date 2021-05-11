/** @format */

var printRequestModel = require("./app/models/newPrintRequest");
var printHandler = require("./handlers/printHandler.js");
var emailer = require("./app/emailer.js");
var payment = require("./app/payment.js");
var path = require("path");
const { table } = require("table");
const axios = require("axios");
var attemptModel = require("./app/models/attempt");

var migrationData = require("./printrequests.json");

printRequestModel.find({}, function (err, results) {
    for (var submission of results) {
        for (var file of submission.files) {
            if (
                file.status == "WAITING_FOR_PICKUP" &&
                file.printing.timestampPrinted < new Date("4/27/2021")
            ) {
                file.status = "STALE_ON_PICKUP";
                console.log("0");
            }
        }
        submission.save();
    }
});

// for (var thisSubmission of migrationData) {
//     var newSubmission = thisSubmission;
//     var theseFiles = newSubmission.files;
//     newSubmission.files = [];

//     delete newSubmission._id;
//     delete newSubmission.__v;
//     delete newSubmission.patron._id;
//     delete newSubmission.patron.__v;

//     for (var [key, value] of Object.entries(newSubmission)) {
//         if (key.includes("timestamp")) {
//             newSubmission[key] = value["$date"];
//         }
//     }

//     newSubmission.classCode = thisSubmission.classDetails.classCode;
//     newSubmission.professor = thisSubmission.classDetails.professor;
//     newSubmission.projectType = thisSubmission.classDetails.projectType;

//     for (var thisFile of theseFiles) {
//         delete thisFile._id;
//         delete thisFile.__v;
//         for (var [key, value] of Object.entries(thisFile)) {
//             if (key.includes("timestamp")) {
//                 thisFile[key] = value["$date"];
//             }
//         }

//         if (thisFile.newTechNotes) {
//             for (var thisNote of thisFile.newTechNotes) {
//                 delete thisNote._id;
//                 delete thisNote.__v;
//                 thisNote.dateAdded = thisNote.dateAdded["$date"];
//             }
//         }

//         var status;

//         if (thisFile.isNewSubmission) {
//             status = "UNREVIEWED";
//         } else if (
//             (thisFile.isPendingPayment || thisFile.isPendingWaive) &&
//             !thisFile.isPaid
//         ) {
//             status = "PENDING_PAYMENT";
//         } else if (thisFile.isReadyToPrint) {
//             status = "READY_TO_PRINT";
//         } else if (thisFile.isInTransit) {
//             status = "IN_TRANSIT";
//         } else if (thisFile.isPrinted && !thisFile.isPickedUp) {
//             status = "WAITING_FOR_PICKUP";
//         } else if (thisFile.isRejected) {
//             status = "REJECTED";
//         } else if (thisFile.isPickedUp) {
//             status = "PICKED_UP";
//         }

//         thisFile.status = status;

//         if (
//             status == "PENDING_PAYMENT" &&
//             thisFile.timestampReviewed < new Date("2021-04-29")
//         ) {
//             thisFile.status = "STALE_ON_PAYMENT";
//         }

//         if (
//             status == "WAITING_FOR_PICKUP" &&
//             thisFile.timestampPrinted < new Date("2021-04-29")
//         ) {
//             thisFile.status = "STALE_ON_PICKUP";
//         }

//         var newFile = {
//             fileName: thisFile.fileName,
//             originalFileName: thisFile.realFileName,
//             status: status,
//             request: {
//                 timestampSubmitted: thisFile.timestampSubmitted,
//                 material: thisFile.material,
//                 infill: thisFile.infill,
//                 color: thisFile.color,
//                 notes: thisFile.notes,
//                 pickupLocation: thisFile.pickupLocation,
//             },
//             review: {
//                 descision: thisFile.isRejected ? "Rejected" : "Accepted",
//                 reviewedBy: thisFile.approvedBy,
//                 timestampReviewed: thisFile.timestampReviewed,
//                 internalNotes: thisFile.newTechNotes,
//                 patronNotes: thisFile.patronNotes,
//                 slicedHours: thisFile.timeHours,
//                 slicedMinutes: thisFile.timeMinutes,
//                 slicedGrams: thisFile.grams,
//                 gcodeName: thisFile.realGcodeName,
//                 originalGcodeName: thisFile.originalGcodeName,
//                 slicedPrinter: thisFile.slicedPrinter,
//                 slicedMaterial: thisFile.slicedMaterial,
//                 printLocation: thisFile.printLocation,
//                 calculatedVolumeCm: thisFile.calculatedVolumeCm,
//             },
//             payment: {
//                 isPendingWaive: thisFile.isPendingWaive ? true : false,
//                 timestampPaymentRequested:
//                     thisSubmission.timestampPaymentRequested,
//                 timestampPaid: thisSubmission.timestampPaid,
//                 paymentType: thisFile.overrideNotes.includes("waived")
//                     ? "WAIVED"
//                     : "PAID",
//                 waivedBy: thisFile.overrideNotes.includes("waived")
//                     ? "jkh0010"
//                     : "",
//                 price: thisFile.timeHours + thisFile.timeMinutes / 60 || 0,
//             },
//             printing: {
//                 printingLocation: thisFile.printLocation,
//                 attemptIDs: [],
//                 timestampPrinted: thisFile.timestampPrinted,
//             },
//         };

//         for (var i = 0; i < thisFile.copies; i++) {
//             newSubmission.files.push(newFile);
//         }
//     }

//     newSubmission.numFiles = newSubmission.files.length;

//     var newSubmission = new printRequestModel(thisSubmission);

//     // newSubmission.validate().catch((err) => {
//     //     console.log(err);
//     // });

//     newSubmission.save();
// }

// attemptModel.findById("6099668ef82e2ba364c64096", function (err, attempt) {
//     const attemptData = [
//         [
//             "Started",
//             attempt.timestampStarted.toLocaleDateString("en-US", {
//                 day: "2-digit",
//                 month: "2-digit",
//                 year: "2-digit",
//             }) +
//                 " @ " +
//                 attempt.timestampStarted.toLocaleTimeString("en-US", {
//                     hour: "numeric",
//                     minute: "2-digit",
//                 }),
//         ],
//         ["Maker", attempt.startedBy],
//         ["Printer", attempt.printerName],
//         ["Location", attempt.location],
//         ["Files", attempt.fileNames.length],
//     ];

//     const attemptConfig = {
//         drawVerticalLine: (lineIndex, columnCount) => {
//             return false;
//         },
//         drawHorizontalLine: (lineIndex, rowCount) => {
//             return (
//                 lineIndex === 0 ||
//                 lineIndex === 1 ||
//                 lineIndex === 3 ||
//                 lineIndex === rowCount - 1 ||
//                 lineIndex === rowCount
//             );
//         },
//         columns: [
//             { alignment: "left", width: 8 },
//             { alignment: "right", width: 19 },
//         ],
//         header: {
//             alignment: "center",
//             content: attempt.prettyID,
//         },
//     };

//     var filesData = [];
//     for (var thisFile of attempt.fileNames) {
//         filesData.push([thisFile]);
//     }

//     const filesConfig = {
//         columns: [{ width: 30 }],
//         drawVerticalLine: (lineIndex, columnCount) => {
//             //return lineIndex === 0 || lineIndex === columnCount;
//             return false;
//         },
//         drawHorizontalLine: (lineIndex, rowCount) => {
//             return lineIndex === rowCount;
//         },
//     };

//     const finalTable =
//         table(attemptData, attemptConfig) +
//         table(filesData, filesConfig).trimEnd();

//     const finalLines = finalTable.split(/\r\n|\r|\n/);
//     axios
//         .post("http://129.120.93.30:5000/print", { lines: finalLines })
//         .then((res) => {
//             console.log("Printed");
//         })
//         .catch((error) => {
//             console.error(error);
//         });
// });

// console.log("here");

// printRequestModel.find({ "files.isNewSubmission": true }, function (err, res) {
//     for (var submission of res) {
//         for (file of submission.files) {
//             file.copiesData.unprinted = file.copies;
//         }
//         submission.save();
//     }
// });

// printRequestModel.find({}, function (err, res) {
//     for (var submission of res) {
//         for (file of submission.files) {
//             if (
//                 file.printingData.copiesPrinted > 0 &&
//                 file.completedCopies.length == 0
//             ) {
//                 console.log(file.printingData);
//                 var completedCopies = [];
//                 for (var i = 0; i < file.printingData.copiesPrinted; i++) {
//                     completedCopies.push({
//                         isInTransit:
//                             file.printingData.location == file.pickupLocation
//                                 ? false
//                                 : true,
//                     });
//                 }
//                 file.completedCopies = completedCopies;
//             }
//         }
//         submission.save();
//     }
// });

// printRequestModel.find(
//     {
//         "files.printingData.copiesPrinted": { $gt: 0 },
//         "files.completedCopies": { $exists: false },
//     },
//     function (err, res) {
//         for (var submission of res) {
//             for (var file of submission.files) {
//                 var completedCopies = [];
//                 for (var i = 0; i < file.printingData.copiesPrinted; i++) {
//                     completedCopies.push({
//                         isInTransit: false,
//                         pickupLocation: "Willis Library",
//                     });
//                 }
//                 file.completedCopies = completedCopies;
//             }
//             submission.save();
//         }
//     }
// );

// printRequestModel.aggregate(
//     [
//         { $unwind: "$files" },
//         {
//             $set: {
//                 "files.completedCopies": {
//                     $filter: {
//                         input: "$files.completedCopies",
//                         as: "item",
//                         cond: { $eq: ["$$item.isInTransit", false] },
//                     },
//                 },
//             },
//         },
//         { $match: { "files.completedCopies.0": { $exists: true } } },
//         {
//             $group: {
//                 _id: "$_id",
//                 doc: { $first: "$$ROOT" },
//                 files: { $addToSet: "$files" },
//             },
//         },
//         {
//             $replaceRoot: {
//                 newRoot: { $mergeObjects: ["$doc", { files: "$files" }] },
//             },
//         },
//     ],
//     function (err, data) {
//         for (var submission of data) {
//             if (submission.patron.fname == "DUMMY") {
//                 for (var file of submission.files) {
//                     console.log(file.completedCopies);
//                 }
//             }
//         }
//     }
// );

/*
printRequestModel.find({ "files.isStarted": true }, function (err, results) {
    for (var submission of results) {
        for (var file of submission.files) {
            console.log(file.printingData.location.length);
            console.log(file.printLocation);
            if (file.printingData.location.length < 1) {
                file.printingData.location = file.printLocation;
            }
        }
        submission.save();
    }
});


printRequestModel.find(
    { "files.printingData": { $exists: false } },
    function (err, result) {
        for (var submission of result) {
            for (var file of submission.files) {
                console.log(file.printingData);
                if (file.printingData) {
                    file.printingData = {
                        rollID: "",
                        rollWeight: 0,
                        finalWeight: 0,
                        weightChange: 0,
                        copiesPrinting: 0,
                        copiesPrinted: 0,
                        location: "",
                        printer: "",
                        numAttempts: 0,
                        numFailedAttempts: 0,
                    };
                }
            }
            submission.save();
        }
    }
);

printRequestModel.find({, function (err, result) {
    for (var submission of result) {
        for (var file of submission.files) {
            var dateSubParsed = new Date(file.dateSubmitted);
            var dateReviewParsed = new Date(file.dateReviewed);
            var datePaidParsed = new Date(file.datePaid);
            var datePrintedParsed = new Date(file.datePrinted);
            var datePickupParsed = new Date(file.datePickedUp);
            var dateFirstParsed = new Date(file.dateOfFirstWarning);
            var dateSecondParsed = new Date(file.dateOfSecondWarning);
            var dateRepoParsed = new Date(file.dateOfConfiscation);

            if (isValidDate(dateSubParsed)) {
                file.timestampSubmitted = dateSubParsed;
            }
            if (isValidDate(dateReviewParsed)) {
                file.timestampReviewed = dateReviewParsed;
            }
            if (isValidDate(datePaidParsed)) {
                file.timestampPaid = datePaidParsed;
            }
            if (isValidDate(datePrintedParsed)) {
                file.timestampPrinted = datePrintedParsed;
            }
            if (isValidDate(datePickupParsed)) {
                file.timestampPickedUp = datePickupParsed;
            }
            if (isValidDate(dateFirstParsed)) {
                file.timestampOfFirstWarning = dateFirstParsed;
            }
            if (isValidDate(dateSecondParsed)) {
                file.timestampOfSecondWarning = dateSecondParsed;
            }
            if (isValidDate(dateRepoParsed)) {
                file.timestampOfConfiscation = dateRepoParsed;
            }
        }
        submission.save();
    }
});

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}


printRequestModel.find({, function (err, result) {
    for (var submission of result) {
        console.log(submission.dateSubmitted);
        console.log(submission.datePaymentRequested);
        console.log(submission.datePaid);
        if (submission.dateSubmitted) {
            submission.timestampSubmitted = new Date(submission.dateSubmitted);
        }
        if (submission.datePaymentRequested) {
            submission.timestampPaymentRequested = new Date(
                submission.datePaymentRequested
            );
        }
        if (submission.datePaid) {
            submission.timestampPaid = new Date(submission.datePaid);
        }
        submission.save();
    }
});


printRequestModel.find({, function (err, result) {
    for (var submission of result) {
        for (var file of submission.files) {
            if (file.isReviewed) {
                if (
                    file.techNotes &&
                    file.techNotes.length > 0 &&
                    file.techNotes.indexOf(":") != -1
                ) {
                    console.log(file._id);
                    var arr = file.techNotes.split(/[\n\r]+/);
                    console.log(arr);
                    for (var thisLine of arr) {
                        var indexColon = thisLine.indexOf(": ");
                        if (indexColon != -1 && indexColon < 20) {
                            var nameAndMessage = thisLine.split(": ");
                            var thisNoteObject = {
                                techName: nameAndMessage[0],
                                dateAdded: "1970",
                                notes: nameAndMessage[1],
                            };
                            console.log(thisNoteObject);
                            file.newTechNotes.push(thisNoteObject);
                        } else {
                            if (thisLine.length > 0) {
                                var otherNoteObject = {
                                    techName: file.approvedBy,
                                    dateAdded: file.timestampReviewed,
                                    notes: thisLine,
                                };
                                console.log(otherNoteObject);
                                file.newTechNotes.push(otherNoteObject);
                            }
                        }
                    }
                    console.log("\n\n----------------\n\n");
                }
            }
        }
        submission.save();
    }
});



171809 sudo nodemon server.js
171817 node /bin/nodemon server.js
192596 sudo nodemon server.js
192604 node /bin/nodemon server.js
242514 /usr/bin/node server.js
404525 /usr/bin/node server.js



179748 sudo nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
179750 node /bin/nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
1814585 node --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
 */
