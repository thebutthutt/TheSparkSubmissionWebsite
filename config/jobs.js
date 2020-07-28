var schedule = require("node-schedule");
const moment = require("moment");
var emailer = require("../config/email.js");

module.exports = function (printRequestModel, constants) {
    var staleOnPickup = function () {
        var today = moment().format(constants.format);
        var oneWeek = moment().subtract(6, "days").format(constants.format); //subtracting six days feom today to satisfy anything before being 7+ days old
        var twoWeeks = moment().subtract(13, "days").format(constants.format);
        var threeWeeks = moment().subtract(20, "days").format(constants.format);
        var whichEmail = "none";
        var filenames = [];

        printRequestModel.find(
            {
                //the file is printed but not picked up yet
                files: {
                    $elemMatch: {
                        isPrinted: true,
                        isPickedUp: false,
                    },
                },
            },
            function (err, result) {
                result.forEach((submission) => {
                    submission.files.forEach((file) => {
                        if (
                            moment(file.datePrinted, "M-D-YY").isBefore(
                                moment(threeWeeks, "M-D-YY")
                            )
                        ) {
                            //file is 3 weeks old, we keep it
                            if (file.dateOfConfiscation == "Not yet sent") {
                                //third contact has not been sent
                                file.dateOfConfiscation = today;
                                file.isStaleOnPickup = true;
                                submission.save();
                                filenames.push(file.fileName);
                                whichEmail = "repo";
                            }
                        } else if (
                            moment(file.datePrinted, "M-D-YY").isBefore(
                                moment(twoWeeks, "M-D-YY")
                            )
                        ) {
                            //file is 2 weeks old, another contact
                            if (file.dateOfSecondWarning == "Not yet sent") {
                                //second contact has not been sent
                                file.dateOfSecondWarning = today;
                                submission.save();
                                filenames.push(file.fileName);
                                whichEmail = "final";
                            }
                        } else if (
                            moment(file.datePrinted, "M-D-YY").isBefore(
                                moment(oneWeek, "M-D-YY")
                            )
                        ) {
                            //file is one week old, send a contact
                            if (file.dateOfFirstWarning == "Not yet sent") {
                                //first contact has not been sent
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
                        emailer.finalWarning(
                            submission.patron.email,
                            filenames
                        );
                    } else if (whichEmail == "first") {
                        console.log("warning prints", filenames);
                        emailer.stillWaiting(
                            submission.patron.email,
                            filenames
                        );
                    }
                });
            }
        );
    };

    var needsCleaning = function () {
        objectToCleanModel.deleteMany({}, function () {}); //delete all old objects to clean from yesterday

        var today = new Date().toISOString();
        today = today.substring(0, 10) + "T00:00:00.000Z";

        var results = [];
        bookingModel.find(
            {
                "calendarEvent.classNames": "quarantine",
                "calendarEvent.start": today,
                "calendarEvent.end": today,
            },
            function (err, data) {
                data.forEach(function (booking) {
                    results.push(booking.camera);
                    results.push(booking.lens1);
                    if (booking.lens1 != booking.lens2) {
                        results.push(booking.lens2);
                    }
                });

                results.forEach(function (item) {
                    var newObject = new objectToCleanModel();
                    newObject.objectName = item;
                    newObject.isCleaned = false;
                    newObject.save();
                });
            }
        );
    };

    schedule.scheduleJob("1 0 * * *", () => {
        //run once every day at midnight and one minute just in case idk im nervous
        staleOnPickup();
        needsCleaning();
    });

    staleOnPickup();
    needsCleaning();
};
