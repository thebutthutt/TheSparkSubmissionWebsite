var mongoose = require("mongoose");
require("./patron.js");

var singlePrintSchema = mongoose.Schema({
    fileName: { type: String, default: "" },
    originalFileName: { type: String, default: "" },

    isReviewed: { type: Boolean, default: false },
    isAccepted: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    isPendingPayment: { type: Boolean, default: false },
    isPendingWaive: { type: Boolean, default: false },
    isStaleOnPayment: { type: Boolean, default: false },
    wasPaid: { type: Boolean, default: false },
    wasWaived: { type: Boolean, default: false },
    isReadyToPrint: { type: Boolean, default: false },
    isStaleOnReady: { type: Boolean, default: false },
    isPrinting: { type: Boolean, default: false },
    isPrintingWillis: { type: Boolean, default: false },
    isPrintingDP: { type: Boolean, default: false },
    isPrinted: { type: Boolean, default: false },
    isInTransit: { type: Boolean, default: false },
    isStaleInTransit: { type: Boolean, default: false },
    isWaitingForPickup: { type: Boolean, default: false },
    isStaleOnPickup: { type: Boolean, default: false },
    isPickedUp: { type: Boolean, default: false },
    isPendingDelete: { type: Boolean, default: false },

    material: { type: String, default: "No Preference" },
    infill: { type: String, default: "12.5%" },
    color: { type: String, default: "No Preference" },
    notes: { type: String, default: "" },
    pickupLocation: { type: String, default: "" },

    calculatedVolumeCm: { type: Number, default: 0 },
    slicedHours: { type: Number, default: 0 },
    slicedMinutes: { type: Number, default: 0 },
    slicedGrams: { type: Number, default: 0 },
    gcodeName: { type: String, default: "" },
    realGcodeName: { type: String, default: "" },
    slicedPrinter: { type: String, default: "" },
    slicedMaterial: { type: String, default: "" },
    printLocation: { type: String, default: "" },
    internalNotes: {
        type: [
            {
                techName: { type: String, default: "" },
                dateAdded: Date,
                notes: { type: String, default: "" },
            },
        ],
        default: [],
    },
    patronNotes: { type: String, default: "" },
    overrideNotes: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },

    timestampSubmitted: { type: Date, default: "1970" },
    timestampReviewed: { type: Date, default: "1970" },
    timestampPaymentRequested: { type: Date, default: "1970" },
    timestampPaid: { type: Date, default: "1970" },
    timestampPrinted: { type: Date, default: "1970" },
    timestampArrivedAtPickup: { type: Date, default: "1970" },
    timestampPickedUp: { type: Date, default: "1970" },

    attemptIDs: {
        type: [{ type: mongoose.Schema.ObjectId, default: "", required: true }],
        default: [],
    },

    completedLocation: { type: String, default: "" },
});

// define the schema for a single patron submission
var printSubmissionSchema = mongoose.Schema({
    patron: {
        type: mongoose.model("Patron").schema,
    },

    isForClass: { type: Boolean, default: false },
    classCode: { type: String, default: "" },
    professor: { type: String, default: "" },
    projectType: { type: String, default: "" },

    isForDepartment: { type: Boolean, default: false },
    department: { type: String, default: "" },
    departmentProject: { type: String, default: "" },

    timestampSubmitted: { type: Date, default: "1970" },
    timestampPaymentRequested: { type: Date, default: "1970" },
    timestampPaid: { type: Date, default: "1970" },

    requestedPrice: { type: Number, default: 0 },
    numFiles: { type: Number, default: 0 },
    allFilesReviewed: { type: Boolean, default: false },
    allFilesPrinted: { type: Boolean, default: false },
    allFilesPickedUp: { type: Boolean, default: false },
    isPendingWaive: { type: Boolean, default: false },
    files: [singlePrintSchema], //array of actual print files
});

module.exports = mongoose.model("Submission", printSubmissionSchema);
