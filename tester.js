/** @format */

var printRequestModel = require("./app/models/printRequest");
var printHandler = require("./handlers/printHandler.js");
var emailer = require("./config/emailer.js");
var payment = require("./config/payment.js");

console.log("here");

async function testEmails() {
    var dummySubmission = await printRequestModel.findOne({
        "patron.fname": "Dummy",
    });

    //console.log(dummySubmission);
    if (dummySubmission) {
        printHandler.requestPayment(dummySubmission, null);
        //emailer.allApproved(dummySubmission, 123.45, "abc.com");
        emailer.readyForPickup(dummySubmission, dummySubmission.files[0]);
    }
}

testEmails();
