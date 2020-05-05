var Request = require('./models/printRequest');

module.exports = {
    //function receives the input from filled out request form and saves to the database
    addToDatabase: function (req) {
        var request = new Request(); //new instance of a request

        //fill the patron details
        request.fname = req.body.first;
        request.lname = req.body.last;
        request.email = req.body.email;
        request.euid = req.body.euid;
        request.notes = req.body.notes;

        //if submitted multiple files, add each
        if (req.body.file instanceof Array) {
            for (let i = 0; i < req.body.file.length; i++) {
                request.files.push({
                    fileName: req.body.file[i],
                    material: req.body.material[i],
                    infill: req.body.infill[i],
                    color: req.body.color[i]
                });
            }
        } else { //else just add the one
            request.files.push({
                fileName: req.body.file,
                material: req.body.material,
                infill: req.body.infill,
                color: req.body.color
            });
        }

        console.log(request);
    }
}