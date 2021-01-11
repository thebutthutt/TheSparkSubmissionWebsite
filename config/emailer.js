/** @format */

const Email = require("email-templates");
const { template, reject } = require("lodash");
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
    // <https://github.com/Automattic/juice>
    juice: true,
    // Override juice global settings <https://github.com/Automattic/juice#juicecodeblocks>
    juiceSettings: {
        tableElements: ["TABLE"],
    },
    juiceResources: {
        preserveImportant: true,
        webResources: {
            //
            // this is the relative directory to your CSS/image assets
            // and its default path is `build/`:
            //
            // e.g. if you have the following in the `<head`> of your template:
            // `<link rel="stylesheet" href="style.css" data-inline="data-inline">`
            // then this assumes that the file `build/style.css` exists
            //
            relativeTo: path.join(__dirname, "emails", "assets"),
            //
            // but you might want to change it to something like:
            // relativeTo: path.join(__dirname, '..', 'assets')
            // (so that you can re-use CSS/images that are used in your web-app)
            //
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
                template: path.join(__dirname, "emails", "allApproved"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    allFiles: inputData,
                    amount: amount,
                    url: url,
                },
            })
            .catch(console.error);
    },
    someApproved: function (submission, amount, url) {
        var recipient = submission.patron.email;
        var files = submission.files;
        var acceptedFiles = files.map(function (file) {
            if (file.isRejected == false) {
                return {
                    fileName: file.realFileName,
                    grams: file.grams,
                    timeHours: file.timeHours,
                    timeMinutes: file.timeMinutes,
                    notes: file.patronNotes,
                };
            }
        });

        var rejectedFiles = files.map(function (file) {
            if (file.isRejected == true) {
                return {
                    fileName: file.realFileName,
                    notes: file.patronNotes,
                };
            }
        });

        email
            .send({
                template: path.join(__dirname, "emails", "allApproved"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    acceptedFiles: acceptedFiles,
                    rejectedFiles: rejectedFiles,
                    amount: amount,
                    url: url,
                },
            })
            .catch(console.error);
    },
    allRejected: function (submission) {},
    modificationRequired: function (submission) {},
    paymentThankYou: function (submission) {},
    paymentWaived: function (submission) {},
    readyForPickup: function (submission, readyFile) {
        var recipient = submission.patron.email;
        email
            .send({
                template: path.join(__dirname, "emails", "fileReady"),
                message: {
                    to: recipient,
                },
                locals: {
                    submission: submission,
                    readyFile: readyFile,
                },
            })
            .catch(console.error);
    },
    firstWarning: function (submission) {},
    finalWarning: function (submission) {},
};
