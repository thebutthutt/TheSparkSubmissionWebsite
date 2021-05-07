var printRequestModel = require("../app/models/newPrintRequest.js");
var attemptModel = require("../app/models/attempt");

module.exports = function (app) {
    app.get("/meta", isLoggedIn, async function (req, res) {
        var results = await attemptModel.aggregate([
            {
                $lookup: {
                    from: "submissions",
                    let: {
                        fileIDs: "$fileIDs",
                    },
                    pipeline: [
                        {
                            $unwind: {
                                path: "$files",
                            },
                        },
                        {
                            $match: {
                                $expr: {
                                    $in: ["$files._id", "$$fileIDs"],
                                },
                            },
                        },
                        {
                            $set: {
                                paidPrice: {
                                    $switch: {
                                        branches: [
                                            {
                                                case: {
                                                    $eq: [
                                                        "$files.payment.paymentType",
                                                        "WAIVED",
                                                    ],
                                                },
                                                then: 0,
                                            },
                                        ],
                                        default: "$files.payment.price",
                                    },
                                },
                            },
                        },
                    ],
                    as: "includedFiles",
                },
            },
            {
                $set: {
                    totalEstimatedGrams: {
                        $sum: "$includedFiles.files.review.slicedGrams",
                    },
                    totalUsedGrams: {
                        $subtract: ["$startWeight", "$endWeight"],
                    },
                    attemptDuration: {
                        $subtract: ["$timestampEnded", "$timestampStarted"],
                    },
                    totalRequestedPrice: {
                        $sum: "$includedFiles.files.payment.price",
                    },
                    totalPaidPrice: {
                        $sum: "$includedFiles.files.paidPrice",
                    },
                },
            },
        ]);
        var totals = {
            estimatedWeight: 0,
            usedWeight: 0,
            printingTime: 0,
            requestedPrice: 0,
            paidPrice: 0,
        };
        for (var thisAttempt of results) {
            var start = new Date(
                thisAttempt.timestampStarted.getFullYear(),
                0,
                0
            );
            var diff = thisAttempt.timestampStarted - start;
            var oneDay = 1000 * 60 * 60 * 24;
            thisAttempt.id = Math.ceil((diff / oneDay / 366) * 10);
            totals.estimatedWeight += thisAttempt.totalEstimatedGrams;
            totals.usedWeight += thisAttempt.totalUsedGrams;
            totals.printingTime += thisAttempt.attemptDuration;
            totals.requestedPrice += thisAttempt.totalRequestedPrice;
            totals.paidPrice += thisAttempt.totalPaidPrice;
        }
        res.render("pages/prints/meta", {
            pgnum: 5,
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
            results: results,
            totals: totals,
        });
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
