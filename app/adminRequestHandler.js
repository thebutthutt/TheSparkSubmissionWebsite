const moment = require('moment');
const constants = require('../config/constants');
var adminRequestModel = require('./models/adminRequest');

module.exports = {
    addDelete: function(itemID) {
        var newRequest = new adminRequestModel();
        newRequest.itemID = itemID;
        newRequest.actionType = "delete";
        newRequest.date = moment().format(constants.format);
    },

    addWaive: function(itemID) {
        var newRequest = new adminRequestModel();
        newRequest.itemID = itemID;
        newRequest.actionType = "waive";
        newRequest.date = moment().format(constants.format);
    },

    addAssign: function(itemID) {
        var newRequest = new adminRequestModel();
        newRequest.itemID = itemID;
        newRequest.actionType = "assign";
        newRequest.date = moment().format(constants.format);
    },

    addReassign: function(itemID, newEUID) {

    }
}