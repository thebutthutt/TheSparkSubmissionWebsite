var mongoose = require("mongoose");

/*
*Total submitted files 
Total approved files
    sum weight, duration
Total rejected files
Total files accepted never paid or waived
Total printed files
    sum weight, duration
Total PAID printed files
    sum weight duration
Total WAIVED printed files
    sum weight duration
Total files picked up
    sum weight, duration
Total files NOT picked up
    sum weight duration
*/

var monthlyRecordSchema = mongoose.Schema({
    startDate: Date,
    endDate: Date,
    lastModified: Date,
    isCurrentMonth: Boolean,

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

module.exports = mongoose.model("monthlyRecord", monthlyRecordSchema);
