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


    isNewSubmission: Boolean,
    isReviewed: Boolean,
    isRejected: Boolean,
    isPendingPayment: Boolean,
    isPendingWaive: Boolean,
    isPaid: Boolean,
    isReadyToPrint: Boolean,
    isPrinted: Boolean,
    isPickedUp: Boolean,
    isPendingDelete: Boolean,
    canBeReviewed: Boolean,
    isStarted: Boolean,
    isStaleOnPickup: Boolean,
    isSigned: Boolean,
    signaturePath: String,


    dateSubmitted: String,
    dateReviewed: String,
    datePaid: String,
    datePrinted: String,
    datePickedUp: String,
    dateOfFirstWarning: String,
    dateOfSecondWarning: String,
    dateOfConfiscation: String,


    gcodeName: String,
    slicedPrinter: String,
    slicedMaterial: String,
    timeHours: Number,
    timeMinutes: Number,
    grams: Number,
    numAttempts: Number,
    numFailedAttempts: Number,

    techNotes: String,
    patronNotes: String,

    approvedBy: String,
    startedBy: String
});

// define the schema for a single patron submission
var printSubmissionSchema = mongoose.Schema({
    patron: mongoose.model('Patron').schema,
    dateSubmitted: String,
    datePaymentRequested: String,
    datePaid: String,
    numFiles: Number,
    allFilesReviewed: Boolean,
    isPendingWaive: Boolean,
    files: [singlePrintSchema], //array of actual print files
});

module.exports = mongoose.model('PrintRequest', printSubmissionSchema);