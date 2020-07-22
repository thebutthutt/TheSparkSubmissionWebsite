const moment = require("moment");
const constants = require("../config/constants");

module.exports = function (
    app,
    passport,
    userModel,
    cleHandler,
    cleRequestModel
) {
    // =====================================
    // CLE REQUESTS ========================
    // =====================================
    // show the CNC, Laser, and Embroidery requests

    //page to display all
    app.get("/workrequests/all", isLoggedIn, function (req, res) {
        cleRequestModel.find(
            {
                isCompleted: false,
            },
            function (err, data) {
                //loading every single top level request FOR NOW
                if (err) {
                    console.log(err);
                }
                res.render("pages/workrequests/workrequests", {
                    pgnum: 5, //workrequests
                    dbdata: data,
                    isAdmin: true,
                    isSuperAdmin: req.user.isSuperAdmin,
                });
            }
        );
    });

    app.get("/unassignedWorkOrders", function (req, res) {
        cleRequestModel.find(
            {
                isAssigned: false,
            },
            function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    submissions = data;
                    userModel.find({}, function (err, data2) {
                        if (err) {
                            console.log(err);
                        } else {
                            users = data2;
                            res.render(
                                "partials/adminParts/unassignedWorkOrders",
                                {
                                    submissions: data,
                                    users: data2,
                                }
                            ); //render the html
                        }
                    });
                }
            }
        );
    });

    app.get("/workorders/details", function (req, res) {
        var id = req.body.id || req.query.id;
        cleRequestModel.find(
            {
                _id: id,
            },
            function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("pages/workrequests/workRequestDetail", {
                        request: data,
                        pgnum: 5,
                        isAdmin: true,
                    });
                }
            }
        );
    });

    app.get("/workrequests/download", function (req, res) {
        var fileName = req.body.fileName || req.query.fileName;
        res.download(fileName);
    });

    app.post("/workrequests/delete", function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        cleHandler.deleteSubmission(submissionID);
        res.json(["done"]); //tell the front end the request is done
    });

    app.post("/workrequests/requestdelete", function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.addDelete(submissionID, "cle");
        res.json(["done"]); //tell the front end the request is done
    });

    app.post("/workrequests/undodelete", function (req, res) {
        var submissionID = req.body.submissionID || req.query.submissionID;
        adminRequestHandler.undoDelete(submissionID, "cle");
        res.json(["done"]); //tell the front end the request is done
    });

    app.post("/workrequests/deletefile", function (req, res) {
        var fileName = req.body.fileName || req.query.fileName;
        cleHandler.deleteFile(fileName);
        res.json(["done"]); //tell the front end the request is done
    });

    app.post("/assignWorkOrder", function (req, res) {
        var submissionID = req.body.submissionID;
        var makerID = req.body.makerID;
        cleRequestModel.findOne(
            {
                _id: submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    userModel.findOne(
                        {
                            _id: makerID,
                        },
                        function (err, result2) {
                            if (err) {
                                console.log(err);
                            } else {
                                result.maker = result2.local.euid;
                                result.isAssigned = true;
                                result.save();
                            }
                        }
                    );
                }
            }
        );
        res.redirect("back");
    });

    app.post("/workrequests/materialintake", function (req, res) {
        var submissionID = req.query.submissionID;
        cleRequestModel.findOne(
            {
                _id: submissionID,
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    var time = moment().format(constants.format);
                    result.materialDescriptions.push(req.body.materials);
                    result.materialLocations.push(req.body.location);
                    result.intakeDates.push(time);
                    result.hasMaterials = true;
                    result.save();
                    res.redirect("back");
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
