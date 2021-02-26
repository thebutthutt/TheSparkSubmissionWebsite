var sprequest = require("sp-request");

module.exports = function (spUser, spPass) {
    // Connect to SPO

    var requester = sprequest.create({
        username: spUser,
        password: spPass,
    });

    requester
        .get("https://myunt.sharepoint.com/sites/SparkMakerspace/_api/web/lists/GetByTitle('Filament Inventory')")
        .then((response) => {
            console.log("List Id: " + response.body.d.Id);
        })
        .catch((err) => {
            console.log("Ohhh, something went wrong...");
        });
};
