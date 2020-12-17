var printRequestModel = require("./app/models/printRequest");
var emailer = require("./config/emailer.js");

console.log("here");

async function testEmails() {
    var dummySubmission = await printRequestModel.findOne({
        "patron.fname": "Dummy",
    });

    console.log(dummySubmission);
    if (dummySubmission) {
        emailer.newSubmission(dummySubmission);
    }
}

testEmails();
