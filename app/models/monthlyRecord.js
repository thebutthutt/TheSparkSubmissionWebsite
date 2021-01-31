var mongoose = require("mongoose");

var monthlyRecordSchema = mongoose.Schema({
    startDate: Date,
    endDate: Date,
    lastModified: Date,
    isCurrentMonth: Boolean,
});

module.exports = mongoose.model("monthlyRecord", monthlyRecordSchema);
