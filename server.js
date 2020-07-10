// set up ======================================================================
// get all the tools we need
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
const WebSocket = require('ws')
var app = express();
var port = 443;

var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');

var constants = require('./config/constants.js');
var printRequestModel = require('./app/models/printRequest');
var cleRequestModel = require('./app/models/cleRequest');
var bookingModel = require('./app/models/booking');
var userModel = require('./app/models/user');
var payment = require('./config/payment.js');

var printHandler = require('./handlers/printHandler.js');
var cleHandler = require('./handlers/cleHandler.js');
var adminRequestHandler = require('./handlers/adminRequestHandler.js');
var cameraHandler = require('./handlers/cameraHandler.js');

// configuration ===============================================================
mongoose.connect(constants.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '1024MB',
}));
app.use(bodyParser.json({
    limit: '1024mb'
})); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating
app.use('/public', express.static(path.join(__dirname + '/public'))); //allow us to grab local files in the public directory
app.use('/three', express.static(__dirname + '/node_modules/three/')); //allow website to access the three.js library
app.use('/fullcalendar', express.static(__dirname + '/node_modules/fullcalendar/')); //allow website to access the three.js library
app.use('/gui', express.static(__dirname + '/node_modules/dat.gui/')); //allow website to access the uploaded STLs (for in site display)
app.use('/uploads', express.static(__dirname + '/app/uploads/')); //allow website to access the uploaded STLs (for in site display)
app.use('/qrcode', express.static(__dirname + '/node_modules/qrcode-generator/')); //allow website to access the uploaded STLs (for in site display)
app.use('/datepicker', express.static(__dirname + '/node_modules/js-datepicker/dist/'));

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// required for passport
app.use(session({
    secret: 'istilllikethefactorymorethanthespark',
    resave: true,
    saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./routes/routes.js')(app, printHandler, cleHandler); // load our routes and pass in our app and fully configured passport
require('./routes/printRoutes.js')(app, passport, userModel, adminRequestHandler, printHandler, printRequestModel, payment); // load our routes and pass in our app and fully configured passport
require('./routes/userRoutes.js')(app, passport, userModel, adminRequestHandler, printRequestModel, cleRequestModel); // load our routes and pass in our app and fully configured passport
require('./routes/cleRoutes.js')(app, passport, userModel, cleHandler, cleRequestModel); // load our routes and pass in our app and fully configured passport
require('./routes/cameraRoutes.js')(app, bookingModel, cameraHandler); // load our routes and pass in our app and fully configured passport

// Job Scheduler ======================================================================
require('./config/jobs.js')(printRequestModel, constants); //make the job scheduler go
//bookingModel.remove({}, function(){})
// launch ======================================================================

var server = https.createServer({
    key: fs.readFileSync('./npserver2048.key'),
    cert: fs.readFileSync('./sparkorders_library_unt_edu_cert.cer'),
    passphrase: 'THEsparkMakerSPACE'
}, app);

const wss = new WebSocket.Server({
    server
});

var CLIENTS=[];
var messiah = -1;
var currentRequestingID;
var currentRequestingIndex;

wss.on('connection', function connection(ws) {
    var iamthemessiah = false;
    CLIENTS.push(ws);

    var clientData = {
        'yourID': CLIENTS.length - 1,
        'messiahID': messiah
    }

    console.log('There are', CLIENTS.length, 'clients')
    console.log('The messiah is index', messiah)

    ws.send(JSON.stringify(clientData));

    ws.on('message', function incoming(data) {
        console.log('received: %s', data);
        //make sure every connected client knows who the messiah is
        if (data == 'I am the messiah') {
            messiah = clientData.yourID; //this is the ID of the messiah
            iamthemessiah = true;
            for (var i=0; i<CLIENTS.length; i++) {
                var newData = {
                    'yourID': i,
                    'messiahID': messiah
                }
                CLIENTS[i].send(JSON.stringify(newData));
            }
            console.log('There are', CLIENTS.length, 'clients')
            console.log('The messiah is index', messiah)
        } else { //this is not the notification that the messiah has returned
            var obj = JSON.parse(data)
            if (obj.sender == 'messiah') { //the messiah is sending a signature
                console.log('recieving signature')
                console.log(currentRequestingID)
                console.log(obj.fileID)
                if (obj.fileID == currentRequestingID) {
                    console.log('authentic signature')
                    CLIENTS[currentRequestingIndex].send('success');
                }
            } else { //a technician is requesting a signature
                var obj = JSON.parse(data)
                currentRequestingID = obj.fileID;
                currentRequestingIndex = clientData.yourID;
                if (messiah != -1) {
                    CLIENTS[messiah].send(data); //pass the data to the messiah
                }
            }
        }
    });

    ws.on('close', function () {
        if (iamthemessiah) {
            messiah = -1;
        }
    });
    
});

server.listen(port, '0.0.0.0');

//http server to redirect to https
var http_server = http.createServer(function (req, res) {
    // 301 redirect (reclassifies google listings)
    res.writeHead(301, {
        "Location": "https://" + req.headers['host'] + req.url
    });
    res.end();
}).listen(80, '0.0.0.0');



console.log('The magic happens on port ' + port);