var printRequestModel = require("../app/models/newPrintRequest");

module.exports = {
    //the print has been picked up by the patron
    markPickedUp: async function (fileID, submissionID) {
        var now = new Date();
        if (fileID) {
            var result = await printRequestModel.findOne({
                "files._id": fileID,
            });
            var thisFile = result.files.id(fileID);
            thisFile.status = "PICKED_UP";
            thisFile.pickup.timestampPickedUp = now;
        } else if (submissionID) {
            var result = await printRequestModel.findById(submissionID);
            for (var file of result.files) {
                if (file.status == "WAITING_FOR_PICKUP") {
                    file.status = "PICKED_UP";
                    file.pickup.timestampPickedUp = now;
                }
            }
        }
        await result.save();

        result.allPickedUp = true;
        for (var file of result.files) {
            if (file.status != "PICKED_UP" && file.status != "REJECTED") {
                result.allPickedUp = false;
            }
        }

        await result.save();
    },
};
