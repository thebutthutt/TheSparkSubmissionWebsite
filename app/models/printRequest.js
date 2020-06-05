var mongoose = require('mongoose');
require('./patron.js');

var singlePrintSchema = mongoose.Schema({
    fileName: String,
    material: String,
    infill: String,
    color: String,
    copies: String,
    notes: String,
    printLocation: String,
    pickupLocation: String,
    isReviewed: Boolean,
    isRejected: Boolean,
    isPaid: Boolean,
    isPrinted: Boolean,
    isPickedUp: Boolean,
    dateSubmitted: String,
    dateReviewed: String,
    datePaid: String,
    datePrinted: String,
    datePickedUp: String,
    gcodeName: String,
    slicedPrinter: String,
    slicedMaterial: String,
    timeHours: Number,
    timeMinutes: Number,
    grams: Number,
    techNotes: String,
    patronNotes: String,
    isPendingDelete: Boolean
});

// define the schema for a single patron submission
var printSubmissionSchema = mongoose.Schema({
    patron: mongoose.model('Patron').schema,
    dateSubmitted: String,
    datePaymentRequested: String,
    datePaid: String,
    numFiles: Number,
    allFilesReviewed: Boolean,
    hasNew: Boolean, //if this submission has new files unreviewed
    hasPendingPayment: Boolean,
    hasReadyToPrint: Boolean,
    hasRejected: Boolean,
    hasAccepted: Boolean,
    hasReadyForPickup: Boolean,
    hasStaleOnPayment: Boolean,
    hasStaleOnPickup: Boolean,
    files: [singlePrintSchema], //array of actual print files
});

module.exports = mongoose.model('PrintRequest', printSubmissionSchema);