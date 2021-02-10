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

    isNewSubmission: Boolean,
    isReviewed: Boolean,
    isRejected: Boolean,
    isPendingPayment: Boolean,
    isPendingWaive: Boolean,
    isPaid: Boolean,
    wasWaived: Boolean,
    isReadyToPrint: Boolean,
    isPrinted: Boolean,
    isPickedUp: Boolean,
    isPendingDelete: Boolean,
    canBeReviewed: Boolean,
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
    realGcodeName: String,
    slicedPrinter: String,
    slicedMaterial: String,
    timeHours: Number,
    timeMinutes: Number,
    grams: Number,
    realGrams: Number, //actual grams entered after printing is finished

    isStarted: Boolean,
    copiesPrinting: Number,
    copiesPrinted: Number,
    numAttempts: Number,
    numFailedAttempts: Number,

    techNotes: String,
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
    dateSubmitted: String,
    datePaymentRequested: String,
    datePaid: String,
    wasWaived: Boolean,

    requestedPrice: Number,
    requestedSingleCopyPrice: Number,
    numFiles: Number,
    allFilesReviewed: Boolean,
    isPendingWaive: Boolean,
    files: [singlePrintSchema], //array of actual print files
});

printSubmissionSchema.methods.getFilesApprovedRejected = function () {
    if (!this.allFilesReviewed) {
        return {
            numAccepted: 0,
            numRejected: 0,
        };
    } else {
        var numAccepted = 0,
            numRejected = 0,
            acceptedGrams = 0,
            acceptedHours = 0,
            acceptedMinutes = 0;
        for (let file of this.files) {
            if (file.isReviewed && file.isRejected) {
                numRejected++;
            } else {
                if (file.isReviewed && !file.isRejected) {
                    numAccepted++;
                    acceptedGrams += file.grams;
                    acceptedHours += file.timeHours;
                    acceptedMinutes += file.timeMinutes;
                }
            }
        }
        return {
            numAccepted: numAccepted,
            numRejected: numRejected,
            acceptedGrams: acceptedGrams,
            acceptedHours: acceptedHours,
            acceptedMinutes: acceptedMinutes,
            totalPayment: this.requestedPrice,
        };
    }
};

module.exports = mongoose.model("PrintRequest", printSubmissionSchema);
