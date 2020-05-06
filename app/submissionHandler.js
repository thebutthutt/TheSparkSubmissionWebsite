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
            euid: fields.euid
        }

        //if submitted multiple files, add each
        for (let i = 0; i < prints[0].length; i++) {
            request.files.push({
                fileName: prints[0][i],
                material: prints[1][i],
                infill: prints[2][i],
                color: prints[3][i],
                copies: prints[4][i]
            });
        }

        console.log(request);

        /*
        console.log(request);
        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            } else {
                console.log('saved');
            }
        });
        */
    }
}