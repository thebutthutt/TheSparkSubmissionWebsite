var sprequest = require("sp-request");

var activeSessions = {};

module.exports = {
    addSharePointToSession: function (sessionID, sharepoint) {
        activeSessions[sessionID] = sharepoint;
        console.log(activeSessions);
        module.exports.testSharepoint(activeSessions[sessionID]);
    },
    removeExpiredSharepoint: function (sessionID) {
        console.log("deleting ", sessionID);
        delete activeSessions[sessionID];
        console.log(activeSessions);
    },
    testSharepoint: function (requester) {
        console.log(requester);
        requester
            .get("https://myunt.sharepoint.com/sites/SparkMakerspace/_api/web/lists/GetByTitle('Filament Inventory')")
            .then((response) => {
                console.log("List Id: " + response.body.d.Id);
            })
            .catch((err) => {
                console.log("Ohhh, something went wrong...");
            });
    },
};
