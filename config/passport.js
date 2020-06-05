// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../app/models/user');

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with euid
            usernameField: 'euid',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, euid, password, done) {
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {
                // find a user whose euid is the same as the forms euid
                // we are checking to see if the user trying to login already exists
                User.findOne({
                    'local.euid': euid
                }, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that euid
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That euid is already taken.'));
                    } else if (req.body.magic == 'The Empire Strikes Back') { 
                        //must enter correct magic words to continue
                        // if there is no user with that euid
                        // create the user
                        var newUser = new User();

                        // set the user's local credentials
                        newUser.local.euid = euid;
                        newUser.local.password = newUser.generateHash(password);
                        newUser.email = req.body.email;
                        if (req.body.superAdmin) {
                            newUser.isSuperAdmin = true;
                        } else {
                            newUser.isSuperAdmin = false;
                        }  

                        console.log(newUser.isSuperAdmin);
                        console.log(newUser.email);

                        // save the user
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });

                        console.log(newUser);
                    } else {
                        //incorrect magic words means no sign up
                        return done(null, false, req.flash('signupMessage', 'Your magic words have no power here.'));
                    }

                });

            });

        }));
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with euid
            usernameField: 'euid',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, euid, password, done) { // callback with euid and password from our form

            // find a user whose euid is the same as the forms euid
            // we are checking to see if the user trying to login already exists
            User.findOne({
                'local.euid': euid
            }, function (err, user) {
                // if there are any errors, return the error before anything else
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, user);
            });

        }));

};