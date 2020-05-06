var mongoose = require('mongoose');
require('./patron.js');

var cleSubmissionSchema = mongoose.Schema({
    patron: mongoose.model('Patron').schema,
    maker: String,
    type: String,
    files: [String],
    notes: String
});

// create the model for a print submission and expose it to our app
module.exports = mongoose.model('CLERequest', cleSubmissionSchema);