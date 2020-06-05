var mongoose = require('mongoose');

var requestSchema = mongoose.Schema({
    itemID: String,
    actionType: String, //delete, waive, or assign
    date: String
});

module.exports = mongoose.model('AdminRequest', requestSchema);