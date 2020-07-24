// set up ======================================================================
// get all the tools we need
var express = require("express");
var https = require("https");
var http = require("http");
var fs = require("fs");
const WebSocket = require("ws");
var app = express();
var port = 443;

var mongoose = require("mongoose");
var passport = require("passport");
var flash = require("connect-flash");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var path = require("path");
var favicon = require("serve-favicon");

var constants = require("./config/constants.js");
var printRequestModel = require("./app/models/printRequest");
var cleRequestModel = require("./app/models/cleRequest");
var bookingModel = require("./app/models/booking");
var objectToCleanModel = require("./app/models/cleaningObject");
var userModel = require("./app/models/user");
var payment = require("./config/payment.js");

var printHandler = require("./handlers/printHandler.js");
var cleHandler = require("./handlers/cleHandler.js");
var adminRequestHandler = require("./handlers/adminRequestHandler.js");
var cameraHandler = require("./handlers/cameraHandler.js");

// configuration ===============================================================
mongoose.connect(constants.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
}); // connect to our database

require("./config/passport")(passport); // pass passport for configuration

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: "1024MB",
    })
);
app.use(
    bodyParser.json({
        limit: "1024mb",
    })
); // get information from html forms

app.set("view engine", "ejs"); // set up ejs for templating
app.use("/public", express.static(path.join(__dirname, "/public"))); //allow us to grab local files in the public directory
app.use("/three", express.static(__dirname + "/node_modules/three/")); //allow website to access the three.js library
app.use(
    "/fullcalendar",
    express.static(__dirname + "/node_modules/fullcalendar/")
); //allow website to access the three.js library
app.use("/gui", express.static(__dirname + "/node_modules/dat.gui/")); //allow website to access the uploaded STLs (for in site display)
app.use("/Uploads", express.static(path.join(__dirname, "../Uploads"))); //allow website to access the uploaded STLs (for in site display)
app.use(
    "/qrcode",
    express.static(__dirname + "/node_modules/qrcode-generator/")
); //allow website to access the uploaded STLs (for in site display)
app.use(
    "/datepicker",
    express.static(__dirname + "/node_modules/js-datepicker/dist/")
);

app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// required for passport
app.use(
    session({
        secret: "istilllikethefactorymorethanthespark",
        resave: true,
        saveUninitialized: true,
    })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require("./routes/routes.js")(app, printHandler, cleHandler); // load our routes and pass in our app and fully configured passport
require("./routes/printRoutes.js")(
    app,
    passport,
    userModel,
    adminRequestHandler,
    printHandler,
    printRequestModel,
    payment
); // load our routes and pass in our app and fully configured passport
require("./routes/userRoutes.js")(
    app,
    passport,
    userModel,
    adminRequestHandler,
    cameraHandler,
    printRequestModel,
    cleRequestModel,
    objectToCleanModel
); // load our routes and pass in our app and fully configured passport
require("./routes/cleRoutes.js")(
    app,
    passport,
    userModel,
    cleHandler,
    cleRequestModel
); // load our routes and pass in our app and fully configured passport
require("./routes/cameraRoutes.js")(app, bookingModel, cameraHandler); // load our routes and pass in our app and fully configured passport

// Job Scheduler ======================================================================
require("./config/jobs.js")(
    printRequestModel,
    bookingModel,
    objectToCleanModel,
    constants
); //make the job scheduler go
//bookingModel.remove({}, function(){})
// launch ======================================================================

var server = https.createServer(
    {
        key: fs.readFileSync("./npserver2048.key"),
        cert: fs.readFileSync("./sparkorders_library_unt_edu_cert.cer"),
        passphrase: "THEsparkMakerSPACE",
    },
    app
);

//=========================================
//				WEB SOCKET
//	Makes signature pad talk to browsers
//			   VERY IMPORTANT
//=========================================
const wss = new WebSocket.Server({
    server,
});

var CLIENTS = [];
var messiah = -1;
var currentRequestingID = -1;
var currentRequestingIndex = -1;

wss.on("connection", function connection(ws) {
    /*
messageStructure: {
	sender: messiah | tech | server
	command: requestPatronSignature | recievePatronSignature | requestAdminLogin | recieveAdminLogin | resetScreen | sendClientInfo
	data: variable
}
*/

    var iamthemessiah = false;
    CLIENTS.push(ws);

    var clientData = {
        yourID: CLIENTS.length - 1,
        messiahID: messiah,
    };

    var connectionMessage = {
        sender: "server",
        command: "sendClientInfo",
        data: clientData,
    };

    ws.send(JSON.stringify(connectionMessage)); //send the known data abobut other clients to the browser

    ws.on("message", function incoming(data) {
        //make sure every connected client knows who the messiah is
        if (data == "I am the messiah") {
            console.log("sigpad connected");
            messiah = clientData.yourID; //this is the ID of the messiah
            iamthemessiah = true;
            for (var i = 0; i < CLIENTS.length; i++) {
                var newData = {
                    yourID: i,
                    messiahID: messiah,
                };
                CLIENTS[i].send(
                    JSON.stringify({
                        sender: "server",
                        command: "sendClientInfo",
                        data: newData,
                    })
                );
            }
        } else {
            var obj = JSON.parse(data);

            //if a tech asks for a signature, tell the signature pad to work
            if (
                obj.sender == "tech" &&
                obj.command == "requestPatronSignature"
            ) {
                currentRequestingIndex = clientData.yourID; //mark what client is interacting with the signature pad
                currentRequestingID = obj.data.fileID; //the ID of the file being signed for
                //send the signature pad the request for a signaturee
                CLIENTS[messiah].send(
                    JSON.stringify({
                        sender: "tech",
                        command: "requestPatronSignature",
                        data: obj.data,
                    })
                );
            } else if (
                obj.sender == "messiah" &&
                obj.command == "recievePatronSignature"
            ) {
                if (obj.data.fileID == currentRequestingID) {
                    //send request for login to the technicians screen
                    CLIENTS[currentRequestingIndex].send(
                        JSON.stringify({
                            sender: "server",
                            command: "requestAdminLogin",
                            data: {
                                fileID: currentRequestingID,
                            },
                        })
                    );
                } else {
                    console.log("Fake signature");
                    CLIENTS[messiah].send(
                        JSON.stringify({
                            sender: "server",
                            command: "resetScreen",
                        })
                    );
                }
            } else if (
                obj.sender == "tech" &&
                obj.command == "recieveAdminLogin"
            ) {
                CLIENTS[messiah].send(
                    JSON.stringify({
                        sender: "server",
                        command: "resetScreen",
                    })
                );
                printHandler.markPickedUp(currentRequestingID);
                currentRequestingID = -1;
                currentRequestingIndex = -1;
            }
        }
    });

    ws.on("close", function () {
        if (iamthemessiah) {
            messiah = -1;
            console.log("sigpad gone");
        }
    });
});

server.listen(port, "0.0.0.0");

//http server to redirect to https
var http_server = http
    .createServer(function (req, res) {
        // 301 redirect (reclassifies google listings)
        res.writeHead(301, {
            Location: "https://" + req.headers["host"] + req.url,
        });
        res.end();
    })
    .listen(80, "0.0.0.0");

console.log("The magic happens on port " + port);
