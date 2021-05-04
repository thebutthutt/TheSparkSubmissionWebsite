/** @format */

const base_url = "https://payments.library.unt.edu/payment/";
const account = process.env.PAYMENT_ACCOUNT;
var printRequestModel = require("../app/models/newPrintRequest");
var fs = require("fs");
var path = require("path");
//var emailer = require("./email.js");
var crypto = require("crypto");
//var emailer = require("./email.js");
var newmailer = require("./emailer.js");

const secret_key = process.env.PAYMENT_KEY;

module.exports = {
    //generate a URL for the patron to pay thrpugh
    generatePaymentURL: function (
        contact_name,
        email,
        acceptedFiles,
        acceptedMessages,
        rejectedFiles,
        rejectedMessages,
        amount,
        submissionID
    ) {
        var concatString = "";
        var newURL = new URL(base_url);
        concatString = concatString.concat(
            account,
            amount,
            contact_name,
            submissionID,
            secret_key
        );

        var otherHash = crypto
            .createHash("md5")
            .update(concatString)
            .digest("hex");

        newURL.searchParams.append("account", account);
        newURL.searchParams.append("amount", amount);
        newURL.searchParams.append("contact_name", contact_name);
        newURL.searchParams.append("submissionID", submissionID);
        newURL.searchParams.append("libhash", otherHash);

        emailer
            .requestPayment(
                email,
                acceptedFiles,
                acceptedMessages,
                rejectedFiles,
                rejectedMessages,
                newURL.href
            )
            .catch(console.error);
    },

    sendPaymentEmail: function (submission, amount, numRejected) {
        var nameString = "";
        nameString = nameString.concat(
            submission.patron.fname,
            " ",
            submission.patron.lname
        );

        var concatString = "";
        var newURL = new URL(base_url);
        concatString = concatString.concat(
            account,
            amount,
            nameString,
            submission._id,
            secret_key
        );

        var otherHash = crypto
            .createHash("md5")
            .update(concatString)
            .digest("hex");

        newURL.searchParams.append("account", account);
        newURL.searchParams.append("amount", amount);
        newURL.searchParams.append("contact_name", nameString);
        newURL.searchParams.append("submissionID", submission._id);
        newURL.searchParams.append("libhash", otherHash);

        if (numRejected > 0) {
            newmailer.someApproved(submission, amount, newURL.href);
        } else {
            newmailer.allApproved(submission, amount, newURL.href);
        }
    },

    handlePaymentURL: async function (req) {
        var query = req.query;
        concatString = "";
        var innerMatch = false,
            outerMatch = false;

        var request_contents = JSON.parse(query.request_contents);

        //concatenate all the params
        concatString = concatString.concat(
            request_contents.account,
            request_contents.amount,
            request_contents.contact_name,
            request_contents.submissionID,
            secret_key
        );

        //hash the params
        var otherHash = crypto
            .createHash("md5")
            .update(concatString)
            .digest("hex");

        //does is match the hash sent over?
        if (otherHash == request_contents.libhash) {
            innerMatch = true;
        }

        concatString = "";
        concatString = concatString.concat(
            query.account,
            query.amount,
            query.request_contents,
            query.transaction_date,
            query.transaction_id,
            secret_key
        );
        otherHash = crypto.createHash("md5").update(concatString).digest("hex");

        //does is match the hash sent over?
        if (otherHash == query.libhash) {
            outerMatch = true;
        }

        if (innerMatch == true && outerMatch == true) {
            return request_contents.submissionID;
        } else {
            console.log("Hashes invalid");
            return false;
        }
    },

    handlePaymentWaive: async function (submissionID, fileID) {},

    updateDatabase: async function (submissionID, wasWaived, waivingEUID) {
        var now = new Date();
        var result = await printRequestModel.findById(submissionID);
        for (var file of result.files) {
            if (file.status != "REJECTED") {
                file.status = "READY_TO_PRINT";
            }

            if (wasWaived) {
                file.payment.paymentType = "WAIVED";
                file.payment.waivedBy = waivingEUID;
            } else {
                file.payment.paymentType = "PAID";
            }

            file.payment.timestampPaid = now;
        }
        if (wasWaived) {
            newmailer.paymentWaived(result);
        } else {
            newmailer.paymentThankYou(result);
        }

        await result.save(); //save the db entry
    },
};
