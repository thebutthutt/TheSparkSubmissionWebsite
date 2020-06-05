const moment = require('moment');
const constants = require('../config/constants');
var adminRequestModel = require('./models/adminRequest');
var printRequestModel = require('./models/printRequest');
var cleRequestModel = require('./models/cleRequest');

module.exports = {
    addDelete: function (itemID, itemType) {
        adminRequestModel.find({
            "itemID": itemID
        }, function (err, data) {
            if (data.length != 0) {
                console.log("Already Added!");
            } else {
                if (itemType == "print") {
                    printRequestModel.findOne({ //find top level print request by single file ID
                        'files._id': itemID
                    }, function (err, result) {
                        if (err) {
                            console.log(err)
                        } else {
                            var newRequest = new adminRequestModel();
                            newRequest.itemID = itemID;
                            newRequest.actionType = "delete";
                            newRequest.date = moment().format(constants.format);
                            result.files.id(itemID).isPendingDelete = true; //mark that the file is pending delete
                            result.save(); //save the entry in the database
                            newRequest.save(); //save admin request entry
                        }
                    });
                }
            }
        });

    },

    addWaive: function (itemID) {
        var newRequest = new adminRequestModel();
        newRequest.itemID = itemID;
        newRequest.actionType = "waive";
        newRequest.date = moment().format(constants.format);
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