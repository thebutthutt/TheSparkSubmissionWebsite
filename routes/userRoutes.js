const fs = require("fs");
var path = require("path");
const disk = require("diskusage");

module.exports = function (
    app,
    passport,
    userModel,
    adminRequestHandler,
    printRequestModel,
    cleRequestModel
) {
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get("/login", isLoggedOut, function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render("pages/users/login", {
            message: req.flash("loginMessage"),
            pgnum: 3, //tells the navbar what page to highlight
            isAdmin: false,
        });
    });

    // process the login form
    app.post(
        "/login",
        passport.authenticate("local-login", {
            successRedirect: "/profile", // redirect to the secure profile section
            failureRedirect: "/login", // redirect back to the signup page if there is an error
            failureFlash: true, // allow flash messages
        })
    );

    app.post("/verify", function (req, res, next) {
        passport.authenticate("local-login", function (err, user, info) {
            if (err) {
                return res.send("error");
            }
            if (!user) {
                return res.send("no user");
            }
            req.logIn(user, function (err) {
                if (err) {
                    return res.send("password");
                }
                return res.send("yes");
            });
        })(req, res, next);
    });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get("/signup", function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render("pages/users/signup", {
            message: req.flash("signupMessage"),
            pgnum: 3, //tells the navbar what page to highlight
            isAdmin: false,
        });
    });

    // process the signup form
    app.post(
        "/signup",
        passport.authenticate("local-signup", {
            successRedirect: "/profile", // redirect to the secure profile section
            failureRedirect: "/signup", // redirect back to the signup page if there is an error
            failureFlash: true, // allow flash messages
        })
    );

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get("/profile", isLoggedIn, function (req, res) {
        var numNew;
        var numPrint;

        //nested callbacks because I'm shit at event driven systems kill me
        getNumNew(printRequestModel, function (numNewReturn) {
            numNew = numNewReturn;
            getNumPrint(printRequestModel, function (numPrintReturn) {
                numPrint = numPrintReturn;
                var prints = {
                    newPrints: numNew,
                    readyPrints: numPrint,
                };

                var size = getTotalSize("/home/hcf0018/webserver/Uploads");

                res.render("pages/users/profile", {
                    message: req.flash("logoutMessage"),
                    pgnum: 3, //tells the navbar what page to highlight
                    user: req.user, // get the user out of session and pass to template
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                    queueData: prints,
                    sizeData: size,
                });
            });
        });
    });

    app.post("/users/delete", function (req, res) {
        var euid = req.body.euid || req.query.euid;
        userModel.deleteOne(
            {
                "local.euid": euid,
            },
            function (err) {
                if (err) {
                    console.log(err);
                } else {
                }
            }
        );
        res.json(["done"]);
    });

    app.post("/users/promote", function (req, res) {
        var euid = req.body.euid || req.query.euid;
        userModel.findOne(
            {
                "local.euid": euid,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.isSuperAdmin = true;
                    result.save();
                }
            }
        );
        res.json(["done"]);
    });

    app.post("/users/demote", function (req, res) {
        var euid = req.body.euid || req.query.euid;
        userModel.findOne(
            {
                "local.euid": euid,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    result.isSuperAdmin = false;
                    result.save();
                }
            }
        );
        res.json(["done"]);
    });

    app.post("/changeName", function (req, res) {
        var euid = req.body.euid || req.query.euid;
        userModel.findOne(
            {
                "local.euid": euid,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (req.body.newName != "") {
                        result.name = req.body.newName;
                        result.save();
                    }
                }
            }
        );
        res.redirect("back");
    });

    app.post("/cameras/clean", function (req, res) {
        var name = req.body.object || req.query.object;
        objectToCleanModel.findOne(
            {
                objectName: name,
            },
            function (err, result) {
                result.isCleaned = true;
                result.save();
                res.json("done");
            }
        );
    });

    app.post("/cameras/unclean", function (req, res) {
        var name = req.body.object || req.query.object;
        objectToCleanModel.findOne(
            {
                objectName: name,
            },
            function (err, result) {
                result.isCleaned = false;
                result.save();
                res.json("done");
            }
        );
    });

    //Display the files pending delete to go into the full action queue
    app.get(
        "/printsPendingDelete",
        function (req, res) {
            var filenames = [],
                fileIDs = [];
            printRequestModel.find(
                {
                    "files.isPendingDelete": true,
                },
                function (err, data) {
                    data.forEach((element) => {
                        element.files.forEach((file) => {
                            if (file.isPendingDelete == true) {
                                filenames.push(file.fileName);
                                fileIDs.push(file._id);
                            }
                        });
                    });

                    res.render("partials/adminParts/printsPendingDelete", {
                        filenames: filenames,
                        fileIDs: fileIDs,
                    }); //render the html
                }
            );
        },
        function (err, html) {
            res.send(html); //send it to the webapp
        }
    );

    //Display the files pending waive to go into the full action queue
    app.get(
        "/printsPendingWaive",
        function (req, res) {
            var submissions = [],
                singleSubmission = [],
                filenames = [];
            printRequestModel.find(
                {
                    files: {
                        $elemMatch: {
                            isPendingWaive: true,
                            isRejected: false,
                        },
                    },
                },
                function (err, data) {
                    data.forEach((submission) => {
                        singleSubmission = []; //clear submission array
                        filenames = []; //clear filenames array
                        singleSubmission.push(submission._id); //submission[i][0] = itemID
                        submission.files.forEach((file) => {
                            if (
                                file.isPendingWaive == true &&
                                file.isRejected == false
                            ) {
                                filenames.push(file.fileName);
                            }
                        });
                        singleSubmission.push(filenames); //submission[i][j] = filenames
                        submissions.push(singleSubmission);
                    });
                    res.render("partials/adminParts/printsPendingWaive", {
                        submissions: submissions,
                    }); //render the html
                }
            );
        },
        function (err, html) {
            res.send(html); //send it to the webapp
        }
    );

    //Display the files pending waive to go into the full action queue
    app.get(
        "/allUsers",
        function (req, res) {
            var euids = [],
                statuses = [],
                names = [],
                myeuid = req.body.myeuid || req.query.myeuid;
            userModel.find({}, function (err, data) {
                data.forEach((element) => {
                    euids.push(element.local.euid);
                    names.push(element.name);
                    statuses.push(element.isSuperAdmin);
                });

                res.render("partials/adminParts/allUsers", {
                    euids: euids,
                    names: names,
                    statuses: statuses,
                    myeuid: myeuid,
                }); //render the html
            });
        },
        function (err, html) {
            res.send(html); //send it to the webapp
        }
    );

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get("/logout", function (req, res) {
        req.logout();
        res.redirect("/");
    });

    app.get("/deleteme", function (req, res) {
        userModel.deleteOne(
            {
                "local.euid": req.user.local.euid,
            },
            function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.logout();
                    res.redirect("/");
                }
            }
        );
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}

//make sure user is logged out
function isLoggedOut(req, res, next) {
    //if the user is already logged in, send them to their profile page
    if (req.isAuthenticated()) {
        req.flash("logoutMessage", "You're already logged in!");
        res.redirect("/profile");
    } else {
        //else let them to the login page
        return next();
    }
}

function getAllFiles(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });

    return arrayOfFiles;
}

function convertBytes(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    if (bytes == 0) {
        return "n/a";
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

    if (i == 0) {
        return bytes + " " + sizes[i];
    }

    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}

function getTotalSize(directoryPath) {
    const arrayOfFiles = getAllFiles(directoryPath);

    let totalSize = 0;

    arrayOfFiles.forEach(function (filePath) {
        totalSize += fs.statSync(filePath).size;
    });

    var human = convertBytes(totalSize);

    var data = {
        human: human,
        bytes: totalSize,
    };

    return data;
}

function getNumPrint(printRequestModel, callback) {
    printRequestModel.find(
        {
            "files.isReadyToPrint": true,
        },
        function (err, result) {
            var num = 0,
                numW = 0,
                numDP = 0;
            result.forEach((submission) => {
                submission.files.forEach((file) => {
                    if (file.isReadyToPrint) {
                        num += 1;
                        if (file.printLocation == "Willis Library") {
                            numW += 1;
                        } else {
                            numDP += 1;
                        }
                    }
                });
            });

            var data = {
                numTotal: num,
                numWillis: numW,
                numDP: numDP,
            };

            callback(data);
        }
    );
}

function getNumNew(printRequestModel, callback) {
    printRequestModel.find(
        {
            "files.isNewSubmission": true,
        },
        function (err, result) {
            var num = 0,
                numW = 0,
                numDP = 0;
            result.forEach((submission) => {
                submission.files.forEach((file) => {
                    if (file.isNewSubmission) {
                        num += 1;
                        if (file.printLocation == "Willis Library") {
                            numW += 1;
                        } else {
                            numDP += 1;
                        }
                    }
                });
            });

            var data = {
                numTotal: num,
                numWillis: numW,
                numDP: numDP,
            };

            callback(data);
        }
    );
}
