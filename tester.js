/** @format */

var printRequestModel = require("./app/models/printRequest");
var printHandler = require("./handlers/printHandler.js");
var emailer = require("./config/emailer.js");
var payment = require("./config/payment.js");

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
