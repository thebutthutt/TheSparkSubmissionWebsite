var mongoose = require("mongoose");
require("./patron.js");

var singlePrintSchema = mongoose.Schema({
    fileName: String,
    realFileName: String,
    material: String,
    infill: String,
    color: String,
    copies: String,
    notes: String,
    printLocation: String,
    pickupLocation: String,

    calculatedVolumeCm: Number,

    isNewSubmission: Boolean,
    isReviewed: Boolean,
    isRejected: Boolean,
    isPendingPayment: Boolean,
    isPendingWaive: Boolean,
    isPaid: Boolean,
    isReadyToPrint: Boolean,
    isPrinted: Boolean,
    isInTransit: Boolean,
    isPickedUp: Boolean,
    isPendingDelete: Boolean,
    canBeReviewed: Boolean,
    isStaleOnPickup: Boolean,
    isStaleOnPayment: Boolean,
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

    timestampSubmitted: {
        type: Date,
        default: "1970",
    },
    timestampReviewed: {
        type: Date,
        default: "1970",
    },
    timestampPaid: {
        type: Date,
        default: "1970",
    },
    timestampPrinted: {
        type: Date,
        default: "1970",
    },
    timestampPickedUp: {
        type: Date,
        default: "1970",
    },
    timestampOfFirstWarning: {
        type: Date,
        default: "1970",
    },
    timestampOfSecondWarning: {
        type: Date,
        default: "1970",
    },
    timestampOfConfiscation: {
        type: Date,
        default: "1970",
    },

    gcodeName: String,
    realGcodeName: String,
    slicedPrinter: String,
    slicedMaterial: String,
    timeHours: Number,
    timeMinutes: Number,
    grams: Number,
    realGrams: Number, //actual grams entered after printing is finished
    completedLocation: String,

    printingData: {
        rollID: String,
        rollWeight: Number,
        copiesPrinting: Number,
        copiesPrinted: Number,
        location: String,
        printer: String,
        numAttempts: Number,
        numFailedAttempts: Number,
    },

    isStarted: Boolean,

    techNotes: String,
    newTechNotes: [
        {
            techName: String,
            dateAdded: Date,
            notes: String,
        },
    ],
    patronNotes: String,

    approvedBy: String,
    startedBy: String,

    overrideNotes: String,

    singleCopyPrice: Number,
    allCopiesPrice: Number,
});

// define the schema for a single patron submission
var printSubmissionSchema = mongoose.Schema({
    patron: mongoose.model("Patron").schema,

    isForClass: Boolean,
    classDetails: {
        classCode: String,
        professor: String,
        projectType: String,
    },

    isForDepartment: Boolean,
    internalDetails: {
        department: String,
        project: String,
    },

    dateSubmitted: String,
    timestampSubmitted: {
        type: Date,
        default: "1970",
    },
    datePaymentRequested: String,
    timestampPaymentRequested: {
        type: Date,
        default: "1970",
    },
    datePaid: String,
    timestampPaid: {
        type: Date,
        default: "1970",
    },

    requestedPrice: Number,
    requestedSingleCopyPrice: Number,
    numFiles: Number,
    allFilesReviewed: Boolean,
    isPendingWaive: Boolean,
    files: [singlePrintSchema], //array of actual print files
});

module.exports = mongoose.model("PrintRequest", printSubmissionSchema);
