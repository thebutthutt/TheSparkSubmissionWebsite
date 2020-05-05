var mongoose = require('mongoose');

// define the schema for a single patron submission
var patronSchema = mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    euid: String
});

// create the model for a print submission and expose it to our app
module.exports = mongoose.model('Patron', patronSchema);