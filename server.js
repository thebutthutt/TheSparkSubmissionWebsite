// set up ======================================================================
// get all the tools we need
var express = require('express');
const https = require('https');
const fs = require('fs');
var app = express();
var port = 443;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
const path = require('path');
var configDB = require('./config/database.js');
var submissionHandler = require('./app/submissionHandler.js');

// configuration ===============================================================
mongoose.connect(configDB.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating
app.use('/public', express.static(path.join(__dirname + '/public'))); //allow us to grab local files in the public directory

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
require('./app/routes.js')(app, passport, submissionHandler); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
https.createServer({
    key: fs.readFileSync('./npserver2048.key'),
    cert: fs.readFileSync('./sparkorders_library_unt_edu_cert.cer'),
    passphrase: 'THEsparkMakerSPACE'
},app).listen(port, '0.0.0.0');
console.log('The magic happens on port ' + port);