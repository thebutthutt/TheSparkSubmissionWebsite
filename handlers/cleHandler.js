const formidable = require("formidable");
const moment = require("moment");
const path = require("path");
const constants = require("../config/constants");
var fs = require("fs");
var cleRequestModel = require("../app/models/cleRequest");

module.exports = {
    handleSubmission: function (req) {
        const form = formidable({ maxFileSize: 1024 * 1024 * 1024 });
        var time = moment(),
            unique = 1,
            filenames = [],
            additional = [];

        form.parse(req, function (err, fields, files) {
            additional.push(time.format(constants.format), filenames);
            module.exports.addEntry(fields, additional);
        });
        form.on("fileBegin", (name, file) => {
            //when a new file comes through
            file.name = time.unix() + unique + file.name; //add special separater so we can get just the filename later
            //yes this is a dumb way to keep track of the original filename but I dont care
            unique += 1; //increment unique so every file is not the same name
            file.path = path.join(__dirname, "../../Uploads/CLE/", file.name);
        });
        form.on("file", function (name, file) {
            filenames.push(file.path);
        });
    },

    addEntry: function (fields, additional) {
        var request = new cleRequestModel(); //new instance of a request
        request.type = fields.requestType;
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
        };
        request.notes = fields.notes;
        request.dateSubmitted = additional[0];
        request.files = additional[1];
        request.maker = "Unassigned";
        request.isCompleted = false;
        request.isAssigned = false;
        request.dateCompleted = "Uncompleted";
        request.dateAssigned = "Unassigned";
        request.isPendingDelete = false;
        request.isPendingAssignment = true;
        request.requestingMaker = "Unassigned";

        request.save(function (err, document) {
            if (err) {
                console.error(err);
            }
        });
    },

    deleteSubmission: function (submissionID) {
        cleRequestModel.deleteOne(
            {
                _id: submissionID,
            },
            function (err) {
                if (err) {
                    console.log(err);
                }
            }
        );
    },

    deleteFile: function (fileName) {
        cleRequestModel.findOne(
            {
                files: fileName,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                }

                //delete file from disk
                fs.unlink(fileName, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });

                //removes the filename fome the subission list of files
                for (var i = 0; i < result.files.length; i++) {
                    if (result.files[i] == fileName) {
                        result.files.splice(i, 1);
                    }
                }

                result.save();
            }
        );
    },
};
