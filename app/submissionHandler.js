var printRequest = require('./models/printRequest');

module.exports = {
    //function receives the input from filled out request form and saves to the database
    handle: function (fields, prints) {
        var request = new printRequest(); //new instance of a request

        //fill the patron details
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
        }

        request.numFiles = prints[6]; //always the number of files
        console.log(prints[6]);
        request.dateSubmitted = prints[5][0]; //always the date submitted

        //if submitted multiple files, add each
        for (let i = 0; i < prints[0].length; i++) {
            request.files.push({
                fileName: prints[0][i],
                material: prints[1][i],
                infill: prints[2][i],
                color: prints[3][i],
                copies: prints[4][i],
                dateSubmitted: prints[5][0] //always holds the date submitted
            });
        }
        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            } else {
                console.log('saved');
            }
        });
        
    }
}