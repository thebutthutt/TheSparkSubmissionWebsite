var printRequest = require('./models/printRequest');

module.exports = {
    //function receives the input from filled out request form and saves to the database
    addPrint: function (req) {
        var request = new printRequest(); //new instance of a request

        //fill the patron details
        request.patron = {
            fname: req.body.first,
            lname: req.body.last,
            email: req.body.email,
            euid: req.body.euid
        }

        //if submitted multiple files, add each
        if (req.body.file instanceof Array) {
            for (let i = 0; i < req.body.file.length; i++) {
                request.files.push({
                    fileName: req.body.file[i],
                    material: req.body.material[i],
                    infill: req.body.infill[i],
                    color: req.body.color[i],
                    notes: req.body.notes
                });
            }
        } else { //else just add the one
            request.files.push({
                fileName: req.body.file,
                material: req.body.material,
                infill: req.body.infill,
                color: req.body.color,
                notes: req.body.notes
            });
        }

        console.log(request);
        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            } else {
                console.log('saved');
            }
        });
    }
}