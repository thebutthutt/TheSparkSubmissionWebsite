// set up ======================================================================
// nodemon shutdown please work

require("dotenv").config();

process.once("SIGUSR2", function () {
    gracefulShutdown(function () {
        process.kill(process.pid, "SIGUSR2");
    });
});

// get all the tools we need
var express = require("express");
var https = require("https");
var http = require("http");
var fs = require("fs");
var app = express();
var port = process.env.PORT;
const cors = require("cors");

var mongoose = require("mongoose");
var passport = require("passport");
var flash = require("connect-flash");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var path = require("path");
var favicon = require("serve-favicon");
var constants = require("./app/constants.js");

console.log(process.pid);

// configuration ===============================================================
mongoose.connect(process.env.MONGO_URI + process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
}); // connect to our database

require("./app/passport")(passport); // pass passport for configuration

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());

app.set("view engine", "ejs"); // set up ejs for templating
app.use("/public/", express.static(path.join(__dirname, "/public"))); //allow us to grab local files in the public directory
app.use("/three/", express.static(__dirname + "/node_modules/three")); //allow website to access the three.js library
app.use("/gui/", express.static(__dirname + "/node_modules/dat.gui")); //allow website to access the uploaded STLs (for in site display)
app.use("/Uploads/", express.static(path.join(__dirname, "../Uploads"))); //allow website to access the uploaded STLs (for in site display)

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
app.use(cors());

// routes ======================================================================
require("./routes/routes.js")(app);
require("./routes/printRoutes.js")(app);
require("./routes/printJobRoutes.js")(app);
require("./routes/metaRoutes.js")(app);
require("./routes/selfServiceRoutes.js")(app);
require("./routes/managementRoutes.js")(app);
require("./routes/returnFilteredQueues.js")(app);
require("./routes/submitAndReview.js")(app);
require("./routes/paymentRoutes.js")(app);
require("./routes/userRoutes.js")(app, passport);
//require("./routes/cleRoutes.js")(app, passport, userModel, cleHandler, cleRequestModel); // load our routes and pass in our app and fully configured passport
//require("./routes/cameraRoutes.js")(app, bookingModel, cameraHandler); // load our routes and pass in our app and fully configured passport

// Job Scheduler ======================================================================
require("./app/jobs.js")(constants); //make the job scheduler go
//bookingModel.remove({}, function(){})
// launch ======================================================================
app.post("/test", function (req, res) {
    console.log(req.body);
    res.send("okay");
});

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

var tester = require("./tester.js");
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
    .listen(process.env.HTTP, "0.0.0.0");

console.log("The magic happens on port " + port);

function gracefulShutdown(callback) {
    console.log("closing");
    server.close(() => {
        console.log("server closed");
        callback();
    });
}

//emailer.newSubmission();
