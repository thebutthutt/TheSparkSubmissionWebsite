var mongoose = require('mongoose');
require('./patron.js');

var otherSubmissionSchema = mongoose.Schema({
    patron: mongoose.model('Patron').schema,
    notes: String
});

module.exports = mongoose.model('OtherRequest', otherSubmissionSchema);