var fs = require("fs");
var path = require("path");
var printRequestModel = require("../app/models/printRequest");
var dailyRecordModel = require("../app/models/dailyRecord");
var monthlyRecordModel = require("../app/models/monthlyRecord");

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

        var thisDay = await dailyRecordModel.findOne({ thisDate: todayDay }).exec();
        if (thisDay != null) {
            return thisDay;
        } else {
            thisDay = await module.exports.createNewDailyRecord(todayDay);
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
        }
    },
    recordNewSubmission: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var thisSubmission = await printRequestModel.findById(submissionID).exec();
        console.log(thisSubmission);

        thisDay.dataRecord.numSubmittedFiles += thisSubmission.numFiles;
        thisDay.dataRecord.numWholeSubmissions += 1;

        thisMonth.dataRecord.numSubmittedFiles += thisSubmission.numFiles;
        thisMonth.dataRecord.numWholeSubmissions += 1;

        console.log(thisDay);
        console.log(thisMonth);
    },
};
