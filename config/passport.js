// load all the things we need
var LocalStrategy = require("passport-local").Strategy;
var LdapStrategy = require("passport-ldapauth");
const fs = require("fs");
var path = require("path");

//grab the whitelist contents from the file
let rawdata = fs.readFileSync(path.join(__dirname, "../app/whitelist.json"));
whitelist = JSON.parse(rawdata);

// load up the user model
var User = require("../app/models/user");

var OPTS = {
    server: {
        url: "ldaps://ldap-auth.untsystem.edu",
        searchBase: "ou=people,o=unt",
        searchFilter: "(uid={{username}})",
    },
};

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

    passport.use(
        new LdapStrategy(OPTS, function (user, done) {
            if (whitelist.whitelist.includes(user.euid)) {
                User.findOne(
                    {
                        "local.euid": user.euid,
                    },
                    function (err, localUser) {
                        // if there are any errors, return the error before anything else
                        if (err) return done(err);

                        // if no user is found, return the message
                        if (!localUser) {
                            var newUser = new User();

                            // set the user's local credentials
                            newUser.local.euid = user.euid;
                            newUser.name = user.euid;
                            if (whitelist.superAdmins.contains(user.euid)) {
                                newUser.isSuperAdmin = true;
                            } else {
                                newUser.isSuperAdmin = false;
                            }

                            // save the user
                            newUser.save(function (err) {
                                if (err) throw err;
                                return done(null, newUser); //makes new local user that matches UNT user cred
                            });
                        } else {
                            console.log(localUser);
                            return done(null, localUser); //return the user in our database matching the UNT user
                        }
                    }
                );
            } else {
                console.log("User not on whitelist");
                return done(null, null);
            }
        })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        "local-login",
        new LocalStrategy(
            {
                // by default, local strategy uses username and password, we will override with euid
                usernameField: "username",
                passwordField: "password",
                passReqToCallback: true, // allows us to pass back the entire request to the callback
            },
            function (req, euid, password, done) {
                // callback with euid and password from our form
                var dn = "uid=" + euid + ",ou=people,o=unt";
                client.bind(dn, password, function (err, res) {
                    if (err == null) {
                        //authenticated with UNT just fine, now check if they exist in our DB
                        User.findOne(
                            {
                                "local.euid": euid,
                            },
                            function (err, user) {
                                // if there are any errors, return the error before anything else
                                if (err) return done(err);

                                // if no user is found, return the message
                                if (!user) {
                                    var newUser = new User();

                                    // set the user's local credentials
                                    newUser.local.euid = euid;
                                    newUser.name = euid;
                                    newUser.isSuperAdmin = false;

                                    // save the user
                                    newUser.save(function (err) {
                                        if (err) throw err;
                                        return done(null, newUser);
                                    });
                                } else {
                                    console.log(user);
                                    return done(null, user);
                                }
                            }
                        );
                    } else {
                        console.log("whopps");
                        return done(err, false);
                    }
                });
            }
        )
    );
};
