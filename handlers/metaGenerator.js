var fs = require("fs");
var path = require("path");
var printRequestModel = require("../app/models/printRequest");
//var dailyRecordModel = require("../app/models/dailyRecord");
//var monthlyRecordModel = require("../app/models/monthlyRecord");
const { isNull } = require("lodash");
const util = require("util");

module.exports = {
    /* 
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

    recordSubmissionRejected: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();

        thisDay.dataRecord.numAllRejectedSubmissions += 1;
        thisDay.dataRecord.numRejectedFiles += thisSubmission.numFiles;

        thisMonth.dataRecord.numAllRejectedSubmissions += 1;
        thisMonth.dataRecord.numRejectedFiles += thisSubmission.numFiles;
    },

    recordPaymentRecieved: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();
    },

    recordPaymentWaived: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();
    },


    recordFilePrinted: async function (fileID) {},


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
*/
    otherStuff: async function () {
        var done = await printRequestModel.aggregate([
            {
                $addFields: {
                    newDateSubmitted: {
                        $toDate: "$dateSubmitted",
                    },
                },
            },
            {
                $match: {
                    $and: [
                        { "files.isPrinted": true },
                        { newDateSubmitted: { $gte: new Date("2021-01-01") } },
                        { newDateSubmitted: { $lte: new Date("2021-02-31") } },
                    ],
                },
            },
            {
                $facet: {
                    bySubmission: [
                        {
                            $bucket: {
                                groupBy: {
                                    $cond: {
                                        if: { $anyElementTrue: ["$files.wasWaived"] },
                                        then: "Waived",
                                        else: "Paid",
                                    },
                                },
                                boundaries: ["Paid", "Waived", "X"],
                                output: {
                                    numSubmissions: { $sum: 1 },
                                    totalPrice: { $sum: "$requestedPrice" },
                                },
                            },
                        },
                    ],
                    byFile: [
                        { $unwind: "$files" },
                        {
                            $bucket: {
                                groupBy: { $cond: ["$files.wasWaived", "Waived", "Paid"] },
                                boundaries: ["Paid", "Waived", "X"],
                                output: {
                                    numFiles: { $sum: 1 },
                                    totalEstGrams: { $sum: "$files.grams" },
                                    totalPrintedGrams: { $sum: "$files.realGrams" },
                                    totalMinutes: {
                                        $sum: { $add: ["$files.timeMinutes", { $multiply: ["$files.timeHours", 60] }] },
                                    },
                                    submissionIDs: { $addToSet: "$_id" },
                                },
                            },
                        },
                    ],
                },
            },
            {
                $count: "Paid",
            },
        ]);

        console.log(util.inspect(done, false, null, true /* enable colors */));
    },

    getAllSubmissionCount: async function () {},
};

/*
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
*/

/*

{
                            $bucket: {
                                groupBy: {
                                    $cond: {
                                        if: { $anyElementTrue: ["$files.wasWaived"] },
                                        then: "Waived",
                                        else: "Paid",
                                    },
                                },
                                boundaries: ["Paid", "Waived", "X"],
                                output: {
                                    count: { $sum: 1 },
                                },
                            },
                        },*/
