var fs = require("fs");
var path = require("path");
var printRequestModel = require("../app/models/printRequest");
var dailyRecordModel = require("../app/models/dailyRecord");
var monthlyRecordModel = require("../app/models/monthlyRecord");

module.exports = {
    getTodaysRecord: async function () {
        var today = new Date();
        var todayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        dailyRecordModel.findOne(
            {
                thisDate: todayDay,
            },
            async function (err, result) {
                console.log(result);
                if (result == null) {
                    //create a new record for today
                    var todaysRecord = new dailyRecordModel();
                    todaysRecord.thisDate = todayDay;
                    todaysRecord.lastModified = today;
                    await todaysRecord.save();
                    return todaysRecord;
                } else {
                    return result;
                    //result.delete();
                }
            }
        );
    },
    getThisMonthRecord: async function () {
        var today = new Date();
        var todayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        monthlyRecordModel.findOne(
            {
                startDate: { $lte: todayDay },
                endDate: { $gte: todayDay },
            },
            async function (err, result) {
                console.log(result);
                if (result == null) {
                    var thisMonthRecord = new monthlyRecordModel();

                    var firstDayOfMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
                    var lastDayOfMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0));

                    thisMonthRecord.startDate = firstDayOfMonth;
                    thisMonthRecord.endDate = lastDayOfMonth;
                    thisMonthRecord.lastModified = today;

                    await thisMonthRecord.save();
                    return thisMonthRecord;
                } else {
                    return result;
                }
            }
        );
    },
    recordNewSubmission: async function (submissionID) {
        var thisDay = await module.exports.getTodaysRecord();
        var thisMonth = await module.exports.getThisMonthRecord();
        var newSubmission = printRequestModel.findById(submissionID);
    },
};
