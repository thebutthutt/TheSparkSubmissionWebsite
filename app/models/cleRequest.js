var mongoose = require('mongoose');
require('./patron.js');

var cleSubmissionSchema = mongoose.Schema({
    patron: mongoose.model('Patron').schema,
    maker: String,
    type: String,
    files: [String],
    notes: String,
    techNotes: String,

    isAssigned: Boolean,
    isCompleted: Boolean,
    hasMaterials: Boolean,
    isPendingDelete: Boolean,
    isPendingAssignment: Boolean,

    materialDescriptions: [String],
    materialLocations: [String],
    intakeDates: [String],

    dateSubmitted: String,
    dateAssigned: String,
    dateCompleted: String,

    requestingMaker: String
});

// create the model for a print submission and expose it to our app
module.exports = mongoose.model('CLERequest', cleSubmissionSchema);