const moment = require('moment');
const constants = require('../config/constants');
var bookingModel = require('../app/models/booking');

module.exports = {
    findAvailableItems: function(startDate, endDate, callback) {
        var removeCameras = [];
        var removeLenses = [];
        var availableItems = [];
        var allCameras = [
            "Canon EOS 5D Mark IV",
            "Canon EOS 7D Mark II",
            "Canon EOS 80D",
            "Canon EOS Rebel T6 (Unit 1)",
            "Canon EOS Rebel T6 (Unit 2)",
            "Canon Rebel SL1"
        ];
        var allLenses = [
            "AT-X 116 PRO DX-II 11-16mm f/2.8",
            "Rokinon 14mm f/2.8",
            "Rokinon Tilt-Shift ​24mm f/3.5",
            "EF-S ​17-55mm f/2.8 IS USM",
            "EF ​50mm f/1.8 STM",
            "EF ​85mm f/1.8 USM",
            "EF ​100mm f/2.8 Macro USM",
            "EF-S ​55-250mm f/4-5.6 IS II",
            "EF ​75-300mm f/4-5.6 III",
        ];

        bookingModel.find({
            "isAccepted": true
        }, function (err, data) {
            if (err) {
                console.log(err)
            } else {
                var bookingStart, bookingEnd, requestStart, requestEnd;
                requestStart = new Date(startDate);
                requestEnd = new Date(endDate);
                data.forEach(function (booking) {
                    bookingStart = new Date(booking.calendarEvent.start);
                    bookingEnd = new Date(booking.calendarEvent.end);
                    if (
                        (bookingStart >= requestStart && bookingStart <= requestEnd) ||
                        (bookingEnd >= requestStart && bookingEnd <= requestEnd)
                    ) {
                        removeCameras.push(booking.camera);
                        removeLenses.push(booking.lens1);
                        removeLenses.push(booking.lens2);
                    }
                });

                var availableCameras = allCameras.filter(function(x) { 
                    return removeCameras.indexOf(x) < 0;
                });

                var availableLenses = allLenses.filter(function(x) { 
                    return removeLenses.indexOf(x) < 0;
                });

                availableItems.push(availableCameras);
                availableItems.push(availableLenses);
                
                if (typeof callback == 'function') {
                    callback(availableItems);
                }
            }
        });
    },

    submitBooking: function(req) {
        var newBooking = new bookingModel();
        var time = new moment();
        var classes = [req.body.camera.replace(/\W/g, ''), req.body.lens1.replace(/\W/g, ''), req.body.lens2.replace(/\W/g, '')]
        var titleName = req.body.camera + ", " + req.body.lens1;
        if (req.body.lens1 != req.body.lens2) {
            titleName = req.body.camera + ", " + req.body.lens1 + ", " + req.body.lens2;
        }

        newBooking.patron = {
            fname: req.body.first,
            lname: req.body.last,
            email: req.body.email,
            euid: req.body.euid,
        }

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
            classNames: classes
        }
        newBooking.save();
    }
}