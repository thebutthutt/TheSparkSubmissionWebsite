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
            .then(console.log)
            .catch(console.error);
        //console.log(submission);
        /*
        email
            .send({
                template: path.join(__dirname, "emails", "test"),
                message: {
                    to: "hanna.flores@unt.edu",
                },
                locals: {
                    name: "Elon",
                },
            })
            .then(console.log)
            .catch(console.error);
        */
    },
    allApproved: function (submission) {},
    someApproved: function (submission) {},
    allRejected: function (submission) {},
    modificationRequired: function (submission) {},
    paymentThankYou: function (submission) {},
    paymentWaived: function (submission) {},
    readyForPickup: function (submission) {},
    firstWarning: function (submission) {},
    finalWarning: function (submission) {},
};
