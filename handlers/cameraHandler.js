const moment = require("moment");
const constants = require("../config/constants");
var bookingModel = require("../app/models/booking");
const { compareSync } = require("bcrypt-nodejs");

module.exports = {
    findAvailableItems: function (startDate, endDate, callback) {
        var removeCameras = [];
        var removeLenses = [];
        var availableItems = [];
        var allCameras = constants.cameras;
        var allLenses = constants.lenses;

        bookingModel.find(
            {
                isAccepted: true,
            },
            function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    var bookingStart, bookingEnd, requestStart, requestEnd;
                    requestStart = new Date(startDate);
                    requestEnd = new Date(endDate);

                    requestEnd.setDate(requestEnd.getDate() + 1); //add one day for the necessary quarantine

                    data.forEach(function (booking) {
                        bookingStart = new Date(booking.calendarEvent.start);
                        bookingEnd = new Date(booking.calendarEvent.end);
                        if (
                            (bookingStart >= requestStart &&
                                bookingStart <= requestEnd) ||
                            (bookingEnd >= requestStart &&
                                bookingEnd <= requestEnd)
                        ) {
                            removeCameras.push(booking.camera);
                            removeLenses.push(booking.lens1);
                            removeLenses.push(booking.lens2);
                        }
                    });

                    var availableCameras = allCameras.filter(function (x) {
                        return removeCameras.indexOf(x) < 0;
                    });

                    var availableLenses = allLenses.filter(function (x) {
                        return removeLenses.indexOf(x) < 0;
                    });

                    availableItems.push(availableCameras);
                    availableItems.push(availableLenses);

                    if (typeof callback == "function") {
                        callback(availableItems);
                    }
                }
            }
        );
    },

    submitBooking: function (req, isForced) {
        var newBooking = new bookingModel();
        var time = new moment();

        //classes dont like to be nonalphanumeric values
        var classes = [
            req.body.camera.replace(/\W/g, ""),
            req.body.lens1.replace(/\W/g, ""),
            req.body.lens2.replace(/\W/g, ""),
        ];

        //make the title of the calendar event descriptive (and long)
        var titleName = req.body.camera + ", " + req.body.lens1;
        if (req.body.lens1 != req.body.lens2) {
            titleName =
                req.body.camera + ", " + req.body.lens1 + ", " + req.body.lens2;
        }

        //placeholder information if this booking was created by superadmin
        if (isForced) {
            newBooking.patron = {
                fname: "The",
                lname: "Spark",
                email: "thespark.unt.edu",
                euid: "unt1890",
            };
        } else {
            newBooking.patron = {
                fname: req.body.first,
                lname: req.body.last,
                email: req.body.email,
                euid: req.body.euid,
            };
        }

        //papaerwork
        newBooking.camera = req.body.camera;
        newBooking.lens1 = req.body.lens1;
        newBooking.lens2 = req.body.lens2;
        newBooking.dateSubmitted = time.format(constants.format);
        newBooking.isAccepted = false;
        newBooking.isRejected = false;
        var startText = new Date(req.body.startDate);
        var endText = new Date(req.body.endDate);
        startText = startText.toISOString();
        endText = endText.toISOString();

        //make the calendar event for fullCalendar to display
        newBooking.calendarEvent = {
            title: titleName,
            start: startText,
            end: endText,
            allDay: true,
            classNames: classes,
        };

        //if this was a superadmin backfill just accept it immediately
        if (isForced) {
            newBooking.isAccepted = true;
            newBooking.dateProcessed = time;
        }
        newBooking.save();

        if (isForced) {
            module.exports.makeQuarantine(newBooking);
        }
    },

    confirmBooking: function (submissionID) {
        bookingModel.findOne(
            {
                _id: submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //set confirmed time and that it is confirmed, then save
                    var time = moment().format(constants.format);
                    result.isAccepted = true;
                    result.dateProcessed = time;
                    result.save();

                    //make a new booking for the 24 hour quarantine/ceaning period

                    module.exports.makeQuarantine(result);
                }
            }
        );
    },

    rejectBooking: function (submissionID) {
        bookingModel.findOne(
            {
                _id: submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    //set confirmed time and that it is confirmed, then save
                    var time = moment().format(constants.format);
                    result.isAccepted = false;
                    result.isRejected = true;
                    result.dateProcessed = time;
                    result.save();
                }
            }
        );
    },

    //just fricking delete it
    deleteBooking: function (submissionID) {
        bookingModel.findOneAndDelete(
            {
                _id: submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                }
            }
        );
    },

    //secondary check to make sure a request is still bookable at the time of review
    //necessary if two requests are made on the same free item, the second one reviewed will then be invalid
    verifyAvailable: function (submissionID, callback) {
        //find the booking we are verifying
        bookingModel.findById(submissionID, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                var bookedCameras = [];
                var bookedLenses = [];
                var bookingStart, bookingEnd, requestStart, requestEnd;
                requestStart = new Date(result.calendarEvent.start);
                requestEnd = new Date(result.calendarEvent.end);

                requestEnd.setDate(requestEnd.getDate() + 1); //add a day to the end for the required quarantine

                var report = {
                    camera: {
                        name: result.camera,
                        isFree: true,
                    },
                    lens1: {
                        name: result.lens1,
                        isFree: true,
                    },
                    lens2: {
                        name: result.lens2,
                        isFree: true,
                    },
                    isBookable: true,
                };

                //find all the other APPROVED bookings
                bookingModel.find(
                    {
                        isAccepted: true,
                    },
                    function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            //make list of all booked cameras and lenses in the time period we want
                            data.forEach(function (booking) {
                                bookingStart = new Date(
                                    booking.calendarEvent.start
                                );
                                bookingEnd = new Date(
                                    booking.calendarEvent.end
                                );
                                if (
                                    (bookingStart >= requestStart &&
                                        bookingStart <= requestEnd) ||
                                    (bookingEnd >= requestStart &&
                                        bookingEnd <= requestEnd)
                                ) {
                                    bookedCameras.push(booking.camera);
                                    bookedLenses.push(booking.lens1);
                                    if (
                                        booking.lens2 != "none" &&
                                        booking.lens2 != "None"
                                    ) {
                                        bookedLenses.push(booking.lens2); //only add lens2 if it isnt null
                                    }
                                }
                            });

                            //mark any items that are found in the list already booked
                            if (bookedCameras.includes(result.camera)) {
                                report.camera.isFree = false;
                            }
                            if (bookedLenses.includes(result.lens1)) {
                                report.lens1.isFree = false;
                            }
                            if (bookedLenses.includes(result.lens2)) {
                                report.lens2.isFree = false;
                            }
                            if (
                                report.camera.isFree == false ||
                                report.lens1.isFree == false ||
                                report.lens2.isFree == false
                            ) {
                                report.isBookable = false; //is only bookable if no components are booked
                            }

                            if (typeof callback == "function") {
                                callback(report);
                            }
                        }
                    }
                );
            }
        });
    },

    makeQuarantine: function (original) {
        var quarantine = new bookingModel();
        var time = new moment();
        var classes = original.calendarEvent.classNames;
        classes.push("quarantine");

        quarantine.patron = {
            fname: "The",
            lname: "Spark",
            email: "thespark.unt.edu",
            euid: "unt1890",
        };

        quarantine.camera = original.camera;
        quarantine.lens1 = original.lens1;
        quarantine.lens2 = original.lens2;
        quarantine.dateSubmitted = time.format(constants.format);
        quarantine.isAccepted = true;
        quarantine.isRejected = false;
        var dateText = new Date(original.calendarEvent.end);

        dateText.setDate(dateText.getDate() + 1);

        dateText = dateText.toISOString();

        quarantine.calendarEvent = {
            title: "Quarantine",
            start: dateText,
            end: dateText,
            allDay: true,
            classNames: classes,
        };

        quarantine.save();
    },
};
