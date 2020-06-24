var schedule = require('node-schedule');
const moment = require('moment');
var emailer = require('../config/email.js');
const email = require('../config/email.js');

module.exports = function (printRequestModel, constants) {
    var staleOnPickup = function () {
        var today = moment().format(constants.format)
        var oneWeek = moment().subtract(6, "days").format(constants.format); //subtracting six days feom today to satisfy anything before being 7+ days old
        var twoWeeks = moment().subtract(13, "days").format(constants.format); 
        var threeWeeks = moment().subtract(20, "days").format(constants.format); 
        var whichEmail = "none";
        var filenames = [];

        printRequestModel.find({
            //the file is printed but not picked up yet
            "files": {$elemMatch: {
                "isPrinted": true,
                "isPickedUp": false
            }}
        }, function (err, result) {
            result.forEach(submission => {
                submission.files.forEach(file => {
                    if (moment(file.datePrinted, "M-D-YY").isBefore(moment(threeWeeks, "M-D-YY"))) {
                        //file is 3 weeks old, we keep it
                        if (file.dateOfConfiscation) { //third contact has not been sent
                            file.dateOfConfiscation = today;
                            file.isStaleOnPickup = true;
                            submission.save();
                            filenames.push(file.fileName);
                            whichEmail = "repo";
                        }
                    } else if (moment(file.datePrinted, "M-D-YY").isBefore(moment(twoWeeks, "M-D-YY"))) {
                        //file is 2 weeks old, another contact
                        if (file.dateOfSecondWarning == null) { //second contact has not been sent
                            file.dateOfSecondWarning = today;
                            submission.save();
                            filenames.push(file.fileName);
                            whichEmail = "final";
                        }
                    } else if (moment(file.datePrinted, "M-D-YY").isBefore(moment(oneWeek, "M-D-YY"))) {
                        //file is one week old, send a contact
                        if (file.dateOfFirstWarning == null) { //first contact has not been sent
                            file.dateOfFirstWarning = today;
                            submission.save();
                            filenames.push(file.fileName);
                            whichEmail = "first";
                        }
                    }
                });

                if (whichEmail == "repo") {
                    console.log("Repo prints", filenames);
                    emailer.repoPrint(submission.patron.email, filenames);
                } else if (whichEmail == "final") {
                    console.log("final warning prints", filenames);
                    emailer.finalWarning(submission.patron.email, filenames);
                } else if (whichEmail == "first") {
                    console.log("warning prints", filenames);
                    emailer.stillWaiting(submission.patron.email, filenames);
                }
            });
        });
    }

    schedule.scheduleJob('1 0 * * *', () => { 
        //run once every day at midnight and one minute just in case idk im nervous
        staleOnPickup();
    });
    staleOnPickup();
}


