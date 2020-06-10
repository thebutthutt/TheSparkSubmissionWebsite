const moment = require('moment');
const constants = require('../config/constants');
var printRequestModel = require('./models/printRequest');
var cleRequestModel = require('./models/cleRequest');

module.exports = {
    addDelete: function (itemID, itemType) {
        if (itemType == "print") {
            printRequestModel.findOne({ //find top level print request by single file ID
                'files._id': itemID
            }, function (err, result) {
                if (err) {
                    console.log(err)
                } else {
                    result.files.id(itemID).isPendingDelete = true; //mark that the file is pending delete
                    result.save(); //save the entry in the database
                }
            });
        } else if (itemType == "cle") {
            cleRequestModel.findById(itemID, function(err, result) {
                if (err) {
                    console.log(err)
                } else {
                    result.isPendingDelete = true; //mark that the file is pending delete
                    result.save(); //save the entry in the database
                }
            });
        }

    },

    undoDelete: function(itemID, itemType) {
        if (itemType == "print") {
            printRequestModel.findOne({ //find top level print request by single file ID
                'files._id': itemID
            }, function (err, result) {
                if (err) {
                    console.log(err)
                } else {
                    result.files.id(itemID).isPendingDelete = false; //mark that the file is NOT pending delete
                    result.save(); //save the entry in the database
                }
            });
        }
    },

    addWaive: function (itemID, itemType) {
        if (itemType == "print") {
            printRequestModel.findOne({ //find top level print request by single file ID
                'files._id': itemID
            }, function (err, result) {
                if (err) {
                    console.log(err)
                } else {
                    result.isPendingWaive = false; //mark that the file is NOT pending delete
                    result.save(); //save the entry in the database
                }
            });
        }
    },

    undoWaive: function (itemID, itemType) {
        if (itemType == "print") {
            printRequestModel.findOne({ //find top level print request by single file ID
                '_id': itemID
            }, function (err, result) {
                if (err) {
                    console.log(err)
                } else {
                    result.isPendingWaive = true; //mark that the file is NOT pending delete
                    result.save(); //save the entry in the database
                }
            });
        }
    },

    addAssign: function (itemID) {
        var newRequest = new adminRequestModel();
        newRequest.itemID = itemID;
        newRequest.actionType = "assign";
        newRequest.date = moment().format(constants.format);
    },

    addReassign: function (itemID, newEUID) {

    }
}