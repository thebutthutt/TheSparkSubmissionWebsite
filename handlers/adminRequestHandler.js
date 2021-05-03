const moment = require("moment");
const constants = require("../app/constants");
var printRequestModel = require("../app/models/newPrintRequest");
//var cleRequestModel = require("../app/models/cleRequest");

module.exports = {
    addDelete: function (itemID, itemType) {
        printRequestModel.findOne(
            {
                //find top level print request by single file ID
                "files._id": itemID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.files.id(itemID).isPendingDelete = true; //mark that the file is pending delete
                    result.save(); //save the entry in the database
                }
            }
        );
    },

    undoDelete: function (itemID, itemType) {
        if (itemType == "print") {
            printRequestModel.findOne(
                {
                    //find top level print request by single file ID
                    "files._id": itemID,
                },
                function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        result.files.id(itemID).isPendingDelete = false; //mark that the file is NOT pending delete
                        result.save(); //save the entry in the database
                    }
                }
            );
        }
    },

    addWaive: function (itemID, itemType) {
        if (itemType == "print") {
            printRequestModel.findOne(
                {
                    //find top level print request by single file ID
                    _id: itemID,
                },
                function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        for (var i = 0; i < result.files.length; i++) {
                            result.files[i].isPendingWaive = true;
                        }
                        result.save(); //save the entry in the database
                    }
                }
            );
        }
    },

    undoWaive: function (itemID, itemType) {
        if (itemType == "print") {
            printRequestModel.findOne(
                {
                    //find top level print request by single file ID
                    _id: itemID,
                },
                function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        for (var i = 0; i < result.files.length; i++) {
                            result.files[i].isPendingWaive = false;
                        }
                        result.save(); //save the entry in the database
                    }
                }
            );
        }
    },

    addAssign: function (itemID) {
        var newRequest = new adminRequestModel();
        newRequest.itemID = itemID;
        newRequest.actionType = "assign";
        newRequest.date = moment().format(constants.format);
    },

    addReassign: function (itemID, newEUID) {},
};
