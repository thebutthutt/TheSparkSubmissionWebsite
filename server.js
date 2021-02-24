// set up ======================================================================

require("dotenv").config();

// get all the tools we need
var express = require("express");
var https = require("https");
var http = require("http");
var fs = require("fs");

var app = express();
var port = process.env.PORT;

var mongoose = require("mongoose");
var passport = require("passport");
var flash = require("connect-flash");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var path = require("path");
var favicon = require("serve-favicon");
var constants = require("./app/constants.js");

var tester = require("./tester.js");

// configuration ===============================================================
mongoose.connect(constants.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}); // connect to our database

require("./app/passport")(passport); // pass passport for configuration

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
app.use("/fullcalendar", express.static(__dirname + "/node_modules/fullcalendar/")); //allow website to access the three.js library
app.use("/gui", express.static(__dirname + "/node_modules/dat.gui/")); //allow website to access the uploaded STLs (for in site display)
app.use("/Uploads", express.static(path.join(__dirname, "../Uploads"))); //allow website to access the uploaded STLs (for in site display)
app.use("/qrcode", express.static(__dirname + "/node_modules/qrcode-generator/")); //allow website to access the uploaded STLs (for in site display)
app.use("/datepicker", express.static(__dirname + "/node_modules/js-datepicker/dist/"));

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
require("./routes/routes.js")(app); // load our routes and pass in our app and fully configured passport
require("./routes/printRoutes.js")(app); // load our routes and pass in our app and fully configured passport
require("./routes/userRoutes.js")(app, passport); // load our routes and pass in our app and fully configured passport
//require("./routes/cleRoutes.js")(app, passport, userModel, cleHandler, cleRequestModel); // load our routes and pass in our app and fully configured passport
//require("./routes/cameraRoutes.js")(app, bookingModel, cameraHandler); // load our routes and pass in our app and fully configured passport

// Job Scheduler ======================================================================
require("./app/jobs.js")(constants); //make the job scheduler go
//bookingModel.remove({}, function(){})
// launch ======================================================================

var server = https.createServer(
    {
        key: fs.readFileSync("./config/npserver2048.key"),
        cert: fs.readFileSync("./config/sparkorders_library_unt_edu_cert.cer"),
        passphrase: "THEsparkMakerSPACE",
        ciphers: [
            "ECDHE-RSA-AES256-SHA384",
            "AES256-SHA256",
            "!RC4",
            "HIGH",
            "!MD5",
            "!aNULL",
            "!EDH",
            "!EXP",
            "!SSLV2",
            "!eNULL",
        ].join(":"),
        honorCipherOrder: true,
    },
    app
);

//sets up the websocket for signature pads
require("./app/websocket.js")(server);

server.listen(port, "0.0.0.0");

//http server to redirect to https
var http_server = http.createServer(function (req, res) {
    // 301 redirect (reclassifies google listings)
    res.writeHead(301, {
        Location: "https://" + req.headers["host"] + req.url,
    });
    res.end();
});

http_server.listen(process.env.HTTP, "0.0.0.0");

console.log("The magic happens on port " + port);

//emailer.newSubmission();
