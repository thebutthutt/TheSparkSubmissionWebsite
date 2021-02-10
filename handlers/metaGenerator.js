var fs = require("fs");
var path = require("path");
var printRequestModel = require("../app/models/printRequest");
var dailyRecordModel = require("../app/models/dailyRecord");
var monthlyRecordModel = require("../app/models/monthlyRecord");
const { isNull } = require("lodash");

module.exports = {
    createNewDailyRecord: async function (usingDate) {
        var newDaily = new dailyRecordModel();
        newDaily.thisDate = usingDate;
        newDaily.lastModified = usingDate;
        newDaily.dataRecord = {};
        await newDaily.save();
        return newDaily;
    },
    createNewMonthlyRecord: async function (usingDate) {
        var firstDayOfMonth = new Date(Date.UTC(usingDate.getFullYear(), usingDate.getMonth(), 1));
        var lastDayOfMonth = new Date(Date.UTC(usingDate.getFullYear(), usingDate.getMonth() + 1, 0));

        var newMonthly = new dailyRecordModel();
        newMonthly.startDate = firstDayOfMonth;
        newMonthly.endDate = lastDayOfMonth;
        newMonthly.lastModified = usingDate;
        newMonthly.dataRecord = {};
        await newMonthly.save();
        return newMonthly;
    },
    getTodaysRecord: async function () {
        var today = new Date();
        var todayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        console.log("get", todayDay);

        var thisDay = await dailyRecordModel.findOne({ thisDate: todayDay }).exec();
        if (thisDay != null) {
            return thisDay;
        } else {
            thisDay = await module.exports.createNewDailyRecord(todayDay);
            return thisDay;
        }
    },
    getThisMonthRecord: async function () {
        var today = new Date();
        var todayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        var thisMonth = await monthlyRecordModel
            .findOne({
                startDate: { $lte: todayDay },
                endDate: { $gte: todayDay },
            })
            .exec();
        if (thisMonth != null) {
            return thisMonth;
        } else {
            thisMonth = await module.exports.createNewMonthlyRecord(todayDay);
            return thisMonth;
        }
    },

    /*
    Fires when a new submission comes in. Just increments the total number
    of submissions and individual files we recieved today and this month
    */
    recordNewSubmission: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();

        thisDay.dataRecord.numSubmittedFiles += thisSubmission.numFiles;
        thisDay.dataRecord.numWholeSubmissions += 1;

        thisMonth.dataRecord.numSubmittedFiles += thisSubmission.numFiles;
        thisMonth.dataRecord.numWholeSubmissions += 1;

        await thisDay.save();
        await thisMonth.save();
    },

    /*
    Fires when a submission is finalised for payment. Records the number of files
    accepted and rejected, and the grams + time for the accepted prints. Records
    the requested paymnt amount. Increments the all, some, or none accepted 
    submission counts as appropriate
    */
    recordPaymentRequest: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();

        var acceptanceData = await thisSubmission.getFilesApprovedRejected();
        console.log(acceptanceData);
        if (acceptanceData.numRejected > 0) {
            //this had rejected files
            thisDay.dataRecord.numAllApprovedSubmissions += 1;
            thisMonth.dataRecord.numAllApprovedSubmissions += 1;
        } else {
            //this had no rejected files
            thisDay.dataRecord.numSomeApprovedSubmissions += 1;
            thisMonth.dataRecord.numSomeApprovedSubmissions += 1;
        }

        var acceptedTime = acceptanceData.acceptedHours + acceptanceData.acceptedMinutes / 60;
        console.log(acceptedTime);

        thisDay.dataRecord.numApprovedFiles += acceptanceData.numAccepted;
        thisDay.dataRecord.numRejectedFiles += acceptanceData.numRejected;
        thisDay.dataRecord.totalApprovedGrams += acceptanceData.acceptedGrams;
        thisDay.dataRecord.totalApprovedTime += acceptedTime;
        thisDay.dataRecord.totalRequestedPayment += acceptanceData.totalPayment;

        thisMonth.dataRecord.numApprovedFiles += acceptanceData.numAccepted;
        thisMonth.dataRecord.numRejectedFiles += acceptanceData.numRejected;
        thisMonth.dataRecord.totalApprovedGrams += acceptanceData.acceptedGrams;
        thisMonth.dataRecord.totalApprovedTime += acceptedTime;
        thisMonth.dataRecord.totalRequestedPayment += acceptanceData.totalPayment;

        await thisDay.save();
        await thisMonth.save();
    },

    /*
    Fires when a submission is totally rejected. Records the files
    */
    recordSubmissionRejected: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();

        thisDay.dataRecord.numAllRejectedSubmissions += 1;
        thisDay.dataRecord.numRejectedFiles += thisSubmission.numFiles;

        thisMonth.dataRecord.numAllRejectedSubmissions += 1;
        thisMonth.dataRecord.numRejectedFiles += thisSubmission.numFiles;
    },

    /*
    Fires when a submission payment is recieved. Records the total paid amount.
    */
    recordPaymentRecieved: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();
    },

    /*
    Fires when the payment is waived for a submission. Records that all files in the
    submission are waived as well
    */
    recordPaymentWaived: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();
    },

    /*
    Fires when one file is marked as completely printed. Records the final grams
    and whether or not this file was paid for or waived. If this is the final file
    in the subission, also increment number of completely printed submissions
    */
    recordFilePrinted: async function (fileID) {},

    /*
    Fires when a file is marked as picked up by the patron. If this is the final
    file in the submission, also increment number of submissions picked up
    */
    recordFilePickedUp: async function (fileID) {},

    testingStuff: async function () {
        var test = await printRequestModel
            .aggregate()
            .match({
                wasWaived: true,
            })
            .unwind("files")
            .match({
                "files.isPrinted": true,
            })
            //This one groups the unwound files back togehter for EACH UNIQUE SUBMISSION
            .group({
                _id: "$_id",
                totalFiles: { $sum: 1 },
                totalEstimatedGrams: { $sum: "$files.grams" },
                totalPrintedGrams: { $sum: "$files.realGrams" },
                totalWaivedPrice: { $first: "$requestedPrice" },
                totalMinutes: { $sum: { $add: ["$files.timeMinutes", { $multiply: ["$files.timeHours", 60] }] } },
            })
            //Now we group them all in one big group
            .group({
                _id: null,
                totalFiles: { $sum: "$totalFiles" },
                averageFiles: { $avg: "$totalFiles" },
                maxFiles: { $max: "$totalFiles" },
                minFiles: { $min: "$totalFiles" },

                totalEstimatedGrams: { $sum: "$totalEstimatedGrams" },
                averageEstimatedGrams: { $avg: "$totalEstimatedGrams" },
                maxEstimatedGrams: { $max: "$totalEstimatedGrams" },
                minEstimatedGrams: { $min: "$totalEstimatedGrams" },

                totalPrintedGrams: { $sum: "$totalPrintedGrams" },
                averagePrintedGrams: { $avg: "$totalPrintedGrams" },
                maxPrintedGrams: { $max: "$totalPrintedGrams" },
                minPrintedGrams: { $min: "$totalPrintedGrams" },

                totalWaivedPrice: { $sum: "$totalWaivedPrice" },
                averageWaivedPrice: { $avg: "$totalWaivedPrice" },
                maxWaivedPrice: { $max: "$totalWaivedPrice" },
                minWaivedPrice: { $min: "$totalWaivedPrice" },

                totalMinutes: { $sum: "$totalMinutes" },
                averageMinutes: { $avg: "$totalMinutes" },
                maxMinutes: { $max: "$totalMinutes" },
                minMinutes: { $min: "$totalMinutes" },
            });

        console.log(test);
    },

    otherStuff: async function () {
        var done = await printRequestModel.aggregate([
            { $unwind: "$files" },
            { $match: { "files.isPrinted": true } },
            {
                $bucket: {
                    groupBy: { $cond: ["$files.wasWaived", "Waived", "Paid"] },
                    boundaries: ["Paid", "Waived", "X"],
                    output: {
                        count: { $sum: 1 },
                        totalEstGrams: { $sum: "$files.grams" },
                        totalPrintedGrams: { $sum: "$files.realGrams" },
                        totalMinutes: {
                            $sum: { $add: ["$files.timeMinutes", { $multiply: ["$files.timeHours", 60] }] },
                        },
                        submissions: {
                            $push: {
                                submissionID: "$_id",
                                requestedPrice: "$requestedPrice",
                            },
                        },
                    },
                },
            },
        ]);

        console.log(done);
    },

    getAllSubmissionCount: async function () {},
};
