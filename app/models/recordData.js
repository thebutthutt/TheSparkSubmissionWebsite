var mongoose = require("mongoose");

var dataSchema = mongoose.Schema({
    //everything that came in
    numSubmittedFiles: { type: Number, default: 0 },
    numWholeSubmissions: { type: Number, default: 0 },

    submittedFileIDs: [String],
    submittedSubmissionsIDs: [String],

    totalRequestedPayment: { type: Number, default: 0 },
    totalRecievedPayment: { type: Number, default: 0 },

    numApprovedFiles: { type: Number, default: 0 },
    approvedFileIDs: [String],

    totalApprovedGrams: { type: Number, default: 0 },
    totalApprovedTime: { type: Number, default: 0 }, //in hours (decimal)

    numRejectedFiles: { type: Number, default: 0 },
    rejectedFileIDs: [String],

    numAllApprovedSubmissions: { type: Number, default: 0 },
    allApprovedSubmissionIDs: [String],

    numSomeApprovedSubmissions: { type: Number, default: 0 },
    someApprovedSubmissionIDs: [String],

    numAllRejectedSubmissions: { type: Number, default: 0 },
    allRejectedSubmissionIDs: [String],

    numStaleOnPaymentFiles: { type: Number, default: 0 },
    staleOnPaymentFileIDs: [String],
    numStaleOnPaymentSubmissions: { type: Number, default: 0 },
    staleOnPaymentSubmissionIDs: [String],

    //Printed and subsets
    numPrintedFiles: { type: Number, default: 0 },
    printedFileIDs: [String],
    numPrintedSubmissions: { type: Number, default: 0 },
    printedSubmissionIDs: [String],
    totalPrintedGrams: { type: Number, default: 0 },
    totalPrintedTime: { type: Number, default: 0 }, //in hours (decimal)

    numPrintedPaidFiles: { type: Number, default: 0 },
    printedPaidFileIDs: [String],
    numPrintedPaidSubmissions: { type: Number, default: 0 },
    printedPaidSubmissionIDs: [String],
    totalPaidGrams: { type: Number, default: 0 },
    totalPaidTime: { type: Number, default: 0 }, //in hours (decimal)

    numPrintedWaivedFiles: { type: Number, default: 0 },
    printedWaivedFileIDs: [String],
    numPrintedWaivedSubmissions: { type: Number, default: 0 },
    printedWaivedSubmissionIDs: [String],
    totalWaivedGrams: { type: Number, default: 0 },
    totalWaivedTime: { type: Number, default: 0 }, //in hours (decimal)

    numFailedAttempts: { type: Number, default: 0 },
    totalFailedGrams: { type: Number, default: 0 },
    totalFailedTime: { type: Number, default: 0 }, //in hours (decimal)

    //Went Home or didnt
    numPickedUpFiles: { type: Number, default: 0 },
    pickedUpFileIDs: [String],
    numPickedUpSubmissions: { type: Number, default: 0 },
    pickedUpSubmissionIDs: [String],
    totalPickedUpGrams: { type: Number, default: 0 },
    totalPickedUpTime: { type: Number, default: 0 }, //in hours (decimal)

    numStaleOnPickupFiles: { type: Number, default: 0 },
    staleOnPickupFileIDs: [String],
    numStaleOnPickupSubmissions: { type: Number, default: 0 },
    staleOnPickupSubmissionIDs: [String],
});

module.exports = mongoose.model("recordData", dataSchema);
