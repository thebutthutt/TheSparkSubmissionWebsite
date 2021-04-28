var mongoose = require("mongoose");

var fullServicePrinterSchema = mongoose.Schema({
    printerType: { type: String, default: "" },
    printerName: { type: String, default: "" },
    printerHelpText: { type: String, default: "" },
    printerLocation: { type: String, default: "" },
    runningJobID: { type: mongoose.Schema.ObjectId, default: "" },
});

module.exports = mongoose.model("FullServicePrinter", fullServicePrinterSchema);
