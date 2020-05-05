var mongoose = require('mongoose');

var singlePrintSchema = mongoose.Schema({
    fileName: String,
    material: String,
    infill: String,
    color: String,
    copies: String,
    notes: String,
});

// define the schema for a single patron submission
var printSubmissionSchema = mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    euid: String,
    files: [singlePrintSchema] //array of actual print files
});

// create the model for a print submission and expose it to our app
module.exports = mongoose.model('PrintRequest', printSubmissionSchema);