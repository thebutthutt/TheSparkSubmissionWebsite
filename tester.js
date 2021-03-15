/** @format */

var printRequestModel = require("./app/models/printRequest");
var printHandler = require("./handlers/printHandler.js");
var emailer = require("./app/emailer.js");
var payment = require("./app/payment.js");
var path = require("path");

console.log("here");

printRequestModel.find({}, function (err, result) {
    for (var submission of result) {
        for (var file of submission.files) {
            if (file.isReviewed) {
                console.log(file.techNotes);
                if (file.techNotes.length > 0) {
                    if (
                        file.techNotes.indexOf(":") == -1 &&
                        file.newTechNotes.length == 0
                    ) {
                        var newNoteObject = {
                            techName: file.approvedBy,
                            dateAdded: file.timestampReviewed,
                            notes: file.techNotes,
                        };
                        file.newTechNotes.push(newNoteObject);
                    }
                }
            }
        }
        submission.save();
    }
});

/*
printRequestModel.find({}, function (err, result) {
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


179748 sudo nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
179750 node /bin/nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
1814585 node --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
 */
