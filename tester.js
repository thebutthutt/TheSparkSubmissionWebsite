/** @format */

var printRequestModel = require("./app/models/printRequest");
var printHandler = require("./handlers/printHandler.js");
var metaGenerator = require("./handlers/metaGenerator.js");
var emailer = require("./app/emailer.js");
var payment = require("./app/payment.js");
var path = require("path");
const NodeStl = require("node-stl");
async function calcAllVolume() {
    var submissions = await printRequestModel.find({});

    for (var submission of submissions) {
        if (submission.files.length > 0) {
            for (var file of submission.files) {
                try {
                    var stl = new NodeStl(
                        path.join(
                            __dirname,
                            "..",
                            "Uploads",
                            "STLs",
                            file.fileName.replace("/home/hcf0018/webserver/Uploads/STLs/", "")
                        ),
                        {
                            density: 1.04,
                        }
                    );
                    console.log(file.fileName.replace("/home/hcf0018/webserver/Uploads/STLs/", ""));
                    console.log(stl.volume + "cm^3"); // 21cm^3
                    file.calculatedVolumeCm = stl.volume;
                } catch (error) {
                    console.log(error);
                }
            }
            submission.save();
        }
    }
}

//calcAllVolume();

console.log("here");

async function testEmails() {
    var dummySubmission = await printRequestModel.findOne({
        "patron.fname": "Dummy",
    });

    //console.log(dummySubmission);
    if (dummySubmission) {
        //printHandler.requestPayment(dummySubmission, null);
        emailer.stillWaiting(dummySubmission, dummySubmission.files);
        //emailer.finalWarning(dummySubmission, dummySubmission.files);
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

async function findAllStalePayment() {
    var stale = await printRequestModel.find({
        "files.isPendingPayment": true,
    });

metaGenerator.otherStuff();

    for (var submission of stale) {
        //console.log(submission);
        for (var file of submission.files) {
            var reviewed = new Date(file.dateReviewed);
            if (reviewed <= new Date("1/1/2021")) {
                file.isStaleOnPayment = true;
            }
        }
        submission.save();
    }
}

//testEmails();
//findAllStalePayment();
//findAllPrices();
/*
179748 sudo nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
179750 node /bin/nodemon --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
1814585 node --tls-cipher-list=ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL server.js
 */
