var mongoose = require("mongoose");
require("./recordData.js");
/*
need to update every :
new submission, 
new approval, 
new rejection, 
new pay request, 
new waive, 
new payment, 
new print complete,
 new pickup
*/

var monthlyRecordSchema = mongoose.Schema({
    startDate: Date,
    endDate: Date,
    lastModified: Date,
    data: mongoose.model("recordData").schema,
});

module.exports = mongoose.model("monthlyRecord", monthlyRecordSchema);
