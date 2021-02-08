var mongoose = require("mongoose");

var dailyRecordSchema = mongoose.Schema({
    thisDate: { type: Date, unique: true, required: true },

    //Unprinted
    numSubmitted: Number,

    numApproved: Number,
    totalApprovedGrams: Number,
    totalApprovedTime: Number, //in hours (decimal)

    numRejected: Number,

    numStaleOnPayment: Number,

    //Printed and subsets
    numPrinted: Number,
    totalPrintedGrams: Number,
    totalPrintedTime: Number, //in hours (decimal)

    numPrintedPaid: Number,
    totalPaidGrams: Number,
    totalPaidTime: Number, //in hours (decimal)

    numPrintedWaived: Number,
    totalWaivedGrams: Number,
    totalWaivedTime: Number, //in hours (decimal)

    numFailedAttempts: Number,
    totalFailedGrams: Number,
    totalFailedTime: Number, //in hours (decimal)

    //Went Home or didnt
    numPickedUp: Number,
    totalPickedUpGrams: Number,
    totalPickedUpTime: Number, //in hours (decimal)

    numStaleOnPickup: Number,
});

module.exports = mongoose.model("dailyRecord", dailyRecordSchema);
