var cleRequestModel = require('./models/cleRequest');
const formidable = require('formidable');
const moment = require('moment');
const fs = require('fs');
const constants = require('../config/constants');

module.exports = {
    addCNC = function(fields) {
        var request = new cleRequestModel(); //new instance of a request
        request.type = "CNC";
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
        }
    },

    addLaser = function() {

    },

    addEmbroidery = function() {

    }
}