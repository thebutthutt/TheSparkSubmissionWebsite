const formidable = require('formidable');
const moment = require('moment');
const constants = require('../config/constants');
var fs = require('fs');
var cleRequestModel = require('./models/cleRequest');

module.exports = {
    handleSubmission: function (req) {
        var time = moment(),
            unique = 1,
            filenames = [],
            additional = [];
        new formidable.IncomingForm().parse(req, function (err, fields, files) {
            additional.push(time.format(constants.format), filenames);
            module.exports.addEntry(fields, additional);
        }).on('fileBegin', (name, file) => { //when a new file comes through
            file.name = time.unix() + unique + constants.delim + file.name; //add special separater so we can get just the filename later
            //yes this is a dumb way to keep track of the original filename but I dont care
            unique += 1; //increment unique so every file is not the same name
            file.path = __dirname + '/uploads/clefiles/' + file.name;
        }).on('file', function (name, file) {
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
        }
        request.notes = fields.notes;
        request.submissionDate = additional[0];
        request.files = additional[1];
        request.maker = "Unassigned";
        request.completed = false;
        request.completedDate = "Uncompleted";

        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            }
        });
    }
}