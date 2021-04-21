/** @format */

var printRequestModel = require("./app/models/printRequest");
var printHandler = require("./handlers/printHandler.js");
var emailer = require("./app/emailer.js");
var payment = require("./app/payment.js");
var path = require("path");

console.log("here");

printRequestModel.find({}, function (err, res) {
    for (var submission of res) {
        for (file of submission.files) {
            if (file.printingData.rollID.length > 1) {
                if (!file.attempts || file.attempts.length < 1) {
                    if (file.printingData.copiesPrinted > 0) {
                        var newAttempt = {
                            copies: file.printingData.copiesPrinted,
                            location: file.printingData.location,
                            printer: file.printingData.printer,
                            isFinished: true,
                            isSuccess: true,
                        };
                        file.attempts.push(newAttempt);
                    }

                    if (file.printingData.copiesPrinting > 0) {
                        var newAttempt = {
                            copies: file.printingData.copiesPrinting,
                            location: file.printingData.location,
                            printer: file.printingData.printer,
                        };
                        file.attempts.push(newAttempt);
                    }

                    if (file.printingData.rollID) {
                        if (!file.filaments || file.filaments.length < 1) {
                            file.filaments.push({
                                rollID: file.printingData.rollID,
                                startWeight: file.printingData.rollWeight,
                                endWeight: file.printingData.finalWeight,
                            });
                        }
                    }
                }
                // console.log("---------------------------");
                // console.log(file.realFileName);
                // console.log("attempts", file.attempts);
                // console.log("filaments", file.filaments);
            }
            file.copiesData = {};
            file.copiesData.printing = file.printingData.copiesPrinting;
            file.copiesData.unprinted =
                file.copies -
                (file.printingData.copiesPrinting +
                    file.printingData.copiesPrinted);
            file.copiesData.completed = file.printingData.copiesPrinted;
        }
        //submission.save();
    }
});

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
