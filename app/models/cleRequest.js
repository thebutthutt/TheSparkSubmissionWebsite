var mongoose = require('mongoose');
require('./patron.js');

var cleSubmissionSchema = mongoose.Schema({
    patron: mongoose.model('Patron').schema,
    maker: String,
    type: String,
    files: [String],
    notes: String,
    isAssigned: Boolean,
    isCompleted: Boolean,
    hasMaterials: Boolean,
    dateSubmitted: String,
    dateAssigned: String,
    dateCompleted: String,
    techNotes: String,
    isPendingDelete: Boolean,
    isPendingAssignment: Boolean,
    requestingMaker: String
});

// create the model for a print submission and expose it to our app
module.exports = mongoose.model('CLERequest', cleSubmissionSchema);