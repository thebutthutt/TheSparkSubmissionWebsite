/** @format */

var printRequestModel = require("./app/models/printRequest");
var printHandler = require("./handlers/printHandler.js");
var metaGenerator = require("./handlers/metaGenerator.js");
var emailer = require("./app/emailer.js");
var payment = require("./app/payment.js");

console.log("here");

async function testEmails() {
    var dummySubmission = await printRequestModel.findOne({
        "patron.lname": "DONOTPRINT",
    });

    //console.log(dummySubmission);
    if (dummySubmission) {
        printHandler.requestPayment(dummySubmission, null);
        //emailer.readyForPickup(dummySubmission, dummySubmission.files[0]);
    }
}

async function findAllPrices() {
    var submissions = await printRequestModel.find({
        files: {
            $elemMatch: {
                isReviewed: true,
                isRejected: false,
            },
        },
    });

    for (const submission of submissions) {
        console.log("\n\n\n");
        var totalPrice = 0,
            totalSinglePrice = 0;
        var acceptedFiles = submission.files.filter(function (file) {
            if (file.isReviewed && !file.isRejected) {
                return true;
            } else {
                return false;
            }
        });

        for (const file of acceptedFiles) {
            var thisCopyPrice = 0,
                allCopiesPrice = 0;
            if (file.timeHours <= 0 && file.timeMinutes <= 59) {
                //if its less than an hour, just charge one dollar
                thisCopyPrice = 1;
            } else {
                //charge hours plus minutes out of 60 in cents
                thisCopyPrice = file.timeHours;
                thisCopyPrice += file.timeMinutes / 60;
            }

            allCopiesPrice = thisCopyPrice * file.copies;
            totalPrice += allCopiesPrice;
            totalSinglePrice += thisCopyPrice;

            thisCopyPrice = (Math.round(thisCopyPrice * 100) / 100).toFixed(2);
            allCopiesPrice = (Math.round(allCopiesPrice * 100) / 100).toFixed(2);

            console.log("File: ", file.realFileName, " price: ", allCopiesPrice);
            file.singleCopyPrice = thisCopyPrice;
            file.allCopiesPrice = allCopiesPrice;
        }
        totalPrice = (Math.round(totalPrice * 100) / 100).toFixed(2);
        totalSinglePrice = (Math.round(totalSinglePrice * 100) / 100).toFixed(2);
        console.log("Total price for submission: ", totalPrice);
        console.log("Total SINGLE price for submission: ", totalSinglePrice);
        submission.requestedPrice = totalPrice;
        submission.requestedSingleCopyPrice = totalSinglePrice;
        submission.save();
    }
}

//findAllPrices();

metaGenerator.otherStuff();

/*
179748 sudo nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
179750 node /bin/nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
1814585 node --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
 */
