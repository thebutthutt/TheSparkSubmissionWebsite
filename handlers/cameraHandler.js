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
                        console.log(availableItems);
                        callback(availableItems);
                    }
                }
            }
        );
    },

    submitBooking: function (req, isForced) {
        var newBooking = new bookingModel();
        var time = new moment();
        var classes = [
            req.body.camera.replace(/\W/g, ""),
            req.body.lens1.replace(/\W/g, ""),
            req.body.lens2.replace(/\W/g, ""),
        ];
        var titleName = req.body.camera + ", " + req.body.lens1;
        if (req.body.lens1 != req.body.lens2) {
            titleName =
                req.body.camera + ", " + req.body.lens1 + ", " + req.body.lens2;
        }

        newBooking.patron = {
            fname: req.body.first,
            lname: req.body.last,
            email: req.body.email,
            euid: req.body.euid,
        };

        newBooking.camera = req.body.camera;
        newBooking.lens1 = req.body.lens1;
        newBooking.lens2 = req.body.lens2;
        newBooking.dateSubmitted = time.format(constants.format);
        newBooking.isAccepted = false;
        newBooking.isRejected = false;

        newBooking.calendarEvent = {
            title: titleName,
            start: req.body.startDate,
            end: req.body.endDate,
            allDay: true,
            classNames: classes,
        };

        if (isForced) {
            newBooking.isAccepted = true;
            newBooking.dateProcessed = time;
        }
        newBooking.save();
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
                    var time = moment().format(constants.format);
                    result.isAccepted = true;
                    result.dateProcessed = time;
                    result.save();
                    console.log(result);
                }
            }
        );
    },

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

    verifyAvailable: function (submissionID, callback) {
        bookingModel.findById(submissionID, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                var bookedCameras = [];
                var bookedLenses = [];
                var bookingStart, bookingEnd, requestStart, requestEnd;
                requestStart = new Date(result.calendarEvent.start);
                requestEnd = new Date(result.calendarEvent.end);
                var report = {
                    isCameraFree: true,
                    isLens1Free: true,
                    isLens2Free: true,
                    isBookable: true,
                };

                bookingModel.find(
                    {
                        isAccepted: true,
                    },
                    function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
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
                                    bookedLenses.push(booking.lens2);
                                }
                            });

                            if (bookedCameras.includes(result.camera)) {
                                report.isCameraFree = false;
                            }
                            if (bookedLenses.includes(result.lens1)) {
                                report.isLens1Free = false;
                            }
                            if (bookedLenses.includes(result.lens2)) {
                                report.isLens2Free = false;
                            }
                            if (
                                report.isCameraFree == false ||
                                report.isLens1Free == false ||
                                report.isLens2Free == false
                            ) {
                                report.isBookable = false;
                            }

                            if (typeof callback == "function") {
                                console.log(report);
                                callback(report);
                            }
                        }
                    }
                );
            }
        });
    },
};
