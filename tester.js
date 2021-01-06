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
        //emailer.allApproved(dummySubmission, 123.45, "abc.com");
        printHandler.requestPayment(dummySubmission._id, null);
    }
}

async function makePayment() {
    var dummySubmission = await printRequestModel.findOne({
        "patron.fname": "Dummy",
    });

    payment.generatePaymentURL();
}

testEmails();
