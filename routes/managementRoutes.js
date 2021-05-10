var fullServicePrinterModel = require("../app/models/fullServicePrinter");
var selfServicePrinterModel = require("../app/models/selfServicePrinter");
module.exports = function (app) {
    app.get("/printers", isLoggedIn, async function (req, res) {
        var allSelf = await selfServicePrinterModel
            .find({})
            .sort({ printerBarcode: 1 });
        var allFull = await fullServicePrinterModel.find({});
        res.render("pages/printers/printers", {
            pgnum: 7, //printers'
            selfService: allSelf,
            fullService: allFull,
            isAdmin: true,
            isSuperAdmin: req.user.isSuperAdmin,
            userID: req.user._id,
        });
    });

    app.post("/newselfservice", isLoggedIn, async function (req, res) {
        var newPrinter = req.body;
        var newSelfService = new selfServicePrinterModel(newPrinter);
        await newSelfService.save();
        res.redirect("/printers");
    });

    app.post("/newfullservice", isLoggedIn, async function (req, res) {
        var newPrinter = req.body;
        var newFullService = new fullServicePrinterModel(newPrinter);
        let saved = await newFullService.save();
        res.redirect("/printers");
    });

    app.post("/deleteselfservice", isLoggedIn, async function (req, res) {
        await selfServicePrinterModel.deleteOne({ _id: req.body.printerID });
        res.redirect("/printers");
    });

    app.post("/deletefullservice", isLoggedIn, async function (req, res) {
        await fullServicePrinterModel.deleteOne({ _id: req.body.printerID });
        res.redirect("/printers");
    });

    app.post("/editselfservice", isLoggedIn, async function (req, res) {
        var toEdit = await selfServicePrinterModel.findById(req.body.printerID);
        toEdit.printerName = req.body.printerName;
        toEdit.printerBarcode = req.body.printerBarcode;
        await toEdit.save();
        res.redirect("/printers");
    });
    app.post("/editfullservice", isLoggedIn, async function (req, res) {
        var toEdit = await fullServicePrinterModel.findById(req.body.printerID);
        toEdit.printerType = req.body.printerType;
        toEdit.printerName = req.body.printerName;
        toEdit.printerHelpText = req.body.printerHelpText;
        toEdit.printerLocation = req.body.printerLocation;
        await toEdit.save();
        res.redirect("/printers");
    });
};
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    req.flash("loginMessage", "Please log in");
    res.redirect("/login");
}
