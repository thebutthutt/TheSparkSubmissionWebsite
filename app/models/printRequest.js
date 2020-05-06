var mongoose = require('mongoose');
require('./patron.js');

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
    patron: mongoose.model('Patron').schema,
    files: [singlePrintSchema] //array of actual print files
});

module.exports = mongoose.model('PrintRequest', printSubmissionSchema);