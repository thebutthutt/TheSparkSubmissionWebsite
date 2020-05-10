var printRequest = require('./models/printRequest');
const formidable = require('formidable');

module.exports = {
    //function receives the input from filled out request form and saves to the database
    addPrint: function (fields, prints) {
        var request = new printRequest(); //new instance of a request

        //fill the patron details
        request.patron = {
            fname: fields.first,
            lname: fields.last,
            email: fields.email,
            euid: fields.euid,
        }

        request.dateSubmitted = prints[7]; //always the date submitted
        request.numFiles = prints[8]; //always the number of files

        //set intitial parameters of the printRequest schema
        request.allFilesReviewed = false;
        request.hasNew = true;
        request.hasPendingPayment = false;
        request.hasReadyToPrin = false;
        request.hasRejected = false;
        request.hasReadyForPickup = false;
        request.hasStaleOnPayment = false;
        request.hasStaleOnPickup = false;

        //loop through the arrays of file details possibly more than one file
        for (let i = 0; i < prints[0].length; i++) {
            request.files.push({
                fileName: prints[0][i],
                material: prints[1][i],
                infill: prints[2][i],
                color: prints[3][i],
                copies: prints[4][i],
                notes: prints[6][i],
                printLocation: prints[5][i],
                pickupLocation: prints[5][i],
                isReviewed: false,
                isRejected: false,
                isPaid: false,
                isPrinted: false,
                isPickedUp: false,
                dateSubmitted: prints[7], //always holds the date submitted
                dateReviewed: "Never",
                datePaid: "Never",
                datePrinted: "Never",
                datePickedUp: "Never"
            });
        }

        //save the top level submission and low level files to the database
        request.save(function (err, document) {
            if (err) {
                return console.error(err);
            }
        });

    },


    //handles the data for a new top level print request with possibly multiple low level file submissions
    handleSubmission: function (req) {
        //arrays of each files specifications (will only hold one entry each if patron submits only one file)
        var filenames = [],
            materials = [],
            infills = [],
            colors = [],
            copies = [],
            notes = [],
            pickups = [],
            prints = [],
            patron = [],
            numFiles = 0,
            time = Date.now();
            //FIX same file name will get the same time stamp big no no!!

        //get the incoming form data
        new formidable.IncomingForm().parse(req, function (err, fields, files) {
                patron = fields; //put the fields data into the patron container to send to the database function
            }).on('field', function (name, field) { //when a new field comes through
                //handling duplicate input names cause for some reason formidable doesnt do it yet...
                //makes arrays of all the duplicate form names
                if (name == 'material') {
                    materials.push(field);
                } else if (name == 'infill') {
                    infills.push(field);
                } else if (name == 'color') {
                    colors.push(field);
                } else if (name == 'copies') {
                    copies.push(field);
                } else if (name == 'pickup') {
                    pickups.push(field);
                } else if (name == 'notes') {
                    notes.push(field);
                }
            })
            .on('fileBegin', (name, file) => { //when a new file comes through
                file.name = time + "%$%$%" + file.name; //add special separater so we can get just the filename later
                //yes this is a dumb way to keep track of the original filename but I dont care
                file.path = __dirname + '/uploads/' + file.name;
            })
            .on('file', (name, file) => {//when a file finishes coming through
                console.log('Uploaded file', file.path); //make sure we got it
                filenames.push(file.path); //add this files path to the list of filenames
                numFiles++; //increment the number of files this top level submission is holding
            }).on('end', function () {
                // add all our lists to one list to pass to the submission handler
                prints.push(filenames);
                prints.push(materials);
                prints.push(infills);
                prints.push(colors);
                prints.push(copies);
                prints.push(pickups);
                prints.push(notes);
                prints.push(time);
                prints.push(numFiles);
                module.exports.addPrint(patron, prints); //send the patron info and the prints info to the database function defined above
            });
    },

    //this function handles when a technician is reviewing a print file within a top level submission
    updateSingle: function(req, callback) {

        //get the incoming form data
        new formidable.IncomingForm().parse(req, function (err, fields, files) {
            //do something with the new form data here
        });

        //fire the callback function (reloads the print review page to show the updated data)
        if (typeof callback == 'function') {
            callback(); //running the callback specified in calling function (in routes.js)
        }
    }
}