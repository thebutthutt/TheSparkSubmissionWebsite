var cleRequestModel = require('./models/cleRequest');
const formidable = require('formidable');
const moment = require('moment');
const fs = require('fs');
const constants = require('../config/constants');

module.exports = {
    handleSubmission: function (req) {
        var time = moment(),
            unique = 1,
            numFiles,
            filenames = [],
            additional = [];
        new formidable.IncomingForm().parse(req, function (err, fields, files) {
            additional.push(time, numFiles, filenames);
            if (fields.requestType == "cnc") {
                module.exports.addCNC(fields, additional);
            }
        }).on('fileBegin', (name, file) => { //when a new file comes through
            file.name = time.unix() + unique + "%$%$%" + file.name; //add special separater so we can get just the filename later
            //yes this is a dumb way to keep track of the original filename but I dont care
            unique += 1; //increment unique so every file is not the same name
            file.path = __dirname + '/uploads/' + file.name;
        }).on('file', function (name, file) {
            filenames.push(file.path);
            numFiles++;
        });

    },

    addCNC: function (fields, additional) {
        var request = new cleRequestModel(); //new instance of a request
        request.type = "CNC";
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
        }
        request.notes = fields.notes;

    },

    addLaser: function () {

    },

    addEmbroidery: function () {

    }
}