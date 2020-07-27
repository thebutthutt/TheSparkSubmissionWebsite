var mongoose = require('mongoose');
require('./patron.js');

var calendarEventSchema = mongoose.Schema({
    title: String,
    start: String,
    end: String,
    allDay: Boolean,
    classNames: [String]
});

var bookingSchema = mongoose.Schema({
    patron: mongoose.model('Patron').schema,
    calendarEvent: calendarEventSchema,
    dateSubmitted: String,
    dateProcessed: String,
    camera: String,
    lens1: String,
    lens2: String,
    isAccepted: Boolean,
    isRejected: Boolean
});

module.exports = mongoose.model('booking', bookingSchema);