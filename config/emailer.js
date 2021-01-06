const Email = require("email-templates");
const { template } = require("lodash");
var nodemailer = require("nodemailer");
const path = require("path");

var smtpserver = "mailhost.unt.edu";
var sender = '"SparkOrders" <no-reply.sparkorders@unt.edu>';
var portNum = 25;

var transporter = nodemailer.createTransport({
    host: smtpserver,
    port: portNum,
    secure: false,
    tls: {
        rejectUnauthorized: false,
    },
});

const email = new Email({
    message: {
        from: sender,
    },
    send: true,
    transport: transporter,
    views: {
        options: {
            extension: "ejs", // <---- HERE
        },
    },
});

module.exports = {
    newSubmission: function (submission) {
        var recipient = submission.patron.email;
        var files = submission.files;
        var fileNames = files.map(function (file) {
            return file.realFileName;
        });
        console.log(fileNames);
        email
            .send({
                template: path.join(__dirname, "emails", "newSubmission"),
                message: {
                    to: recipient,
                },
                locals: {
                    fileNames: fileNames,
                },
            })
            .catch(console.error);
    },
    allApproved: function (submission, amount, url) {
        var recipient = submission.patron.email;
        var files = submission.files;
        var inputData = files.map(function (file) {
            return {
                fileName: file.realFileName,
                grams: file.grams,
                timeHours: file.timeHours,
                timeMinutes: file.timeMinutes,
                notes: file.patronNotes,
            };
        });
        email
            .send({
                template: path.join(__dirname, "emails", "allApprovedEJS"),
                message: {
                    to: recipient,
                },
                locals: {
                    allFiles: inputData,
                    amount: amount,
                    url: url,
                },
            })
            .catch(console.error);
    },
    someApproved: function (submission, amount, url) {},
    allRejected: function (submission) {},
    modificationRequired: function (submission) {},
    paymentThankYou: function (submission) {},
    paymentWaived: function (submission) {},
    readyForPickup: function (submission) {},
    firstWarning: function (submission) {},
    finalWarning: function (submission) {},
};
