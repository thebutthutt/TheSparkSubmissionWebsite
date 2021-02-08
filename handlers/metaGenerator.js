var fs = require("fs");
var path = require("path");
var printRequestModel = require("../app/models/printRequest");
var dailyRecordModel = require("../app/models/dailyRecord");
var monthlyRecordModel = require("../app/models/monthlyRecord");

module.exports = {
    getTodaysRecord: async function () {
        var today = new Date();
        today = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        console.log(today);

        dailyRecordModel.findOne(
            {
                thisDate: today,
            },
            function (err, result) {
                console.log(result);
                if (result == null) {
                    //create a new record for today
                    var todaysRecord = new dailyRecordModel();
                    todaysRecord.thisDate = today;
                    todaysRecord.numSubmitted = 0;

                    todaysRecord.numApproved = 0;
                    todaysRecord.totalApprovedGrams = 0;
                    todaysRecord.totalApprovedTime = 0; //in hours (decimal)

                    todaysRecord.numRejected = 0;

                    todaysRecord.numStaleOnPayment = 0;

                    //Printed and subsets
                    todaysRecord.numPrinted = 0;
                    todaysRecord.totalPrintedGrams = 0;
                    todaysRecord.totalPrintedTime = 0; //in hours (decimal)

                    todaysRecord.numPrintedPaid = 0;
                    todaysRecord.totalPaidGrams = 0;
                    todaysRecord.totalPaidTime = 0; //in hours (decimal)

                    todaysRecord.numPrintedWaived = 0;
                    todaysRecord.totalWaivedGrams = 0;
                    todaysRecord.totalWaivedTime = 0; //in hours (decimal)

                    todaysRecord.numFailedAttempts = 0;
                    totalFailedGrams = 0;
                    todaysRecord.totalFailedTime = 0; //in hours (decimal)

                    //Went Home or didnt
                    todaysRecord.numPickedUp = 0;
                    todaysRecord.totalPickedUpGrams = 0;
                    todaysRecord.totalPickedUpTime = 0; //in hours (decimal)

                    todaysRecord.numStaleOnPickup = 0;

                    todaysRecord.save();
                    return todaysRecord;
                } else {
                    return result;
                }
            }
        );
    },
};
