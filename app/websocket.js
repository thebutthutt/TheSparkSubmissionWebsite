//BACKEND SERVER WEBSOCKET
var printHandler = require("../handlers/printHandler.js");
const WebSocket = require("ws");
module.exports = function (server) {
    //=========================================
    //				WEB SOCKET
    //	Makes signature pad talk to browsers
    //			   VERY IMPORTANT
    //=========================================
    const wss = new WebSocket.Server({
        server,
    });

    var CLIENTS = [];

    var sigPadIDs = {
        willis: -1,
        dp: -1,
    };

    /**
     * This is a unique scope for each connected client
     */
    wss.on("connection", function connection(ws) {
        CLIENTS.push(ws);

        var thisConnectionID = CLIENTS.length - 1;

        ws.send(
            JSON.stringify({
                sender: "server",
                command: "sendClientInfo",
                data: {
                    yourID: thisConnectionID,
                    sigPadIDs: sigPadIDs,
                },
            })
        ); //send the known data abobut other clients to the browser

        ws.on("message", function incoming(data) {
            var obj = JSON.parse(data);
            switch (obj.command) {
                case "sigpadConnected":
                    if (obj.location == "willis") {
                        sigPadIDs.willis = thisConnectionID;
                    } else {
                        sigPadIDs.dp = thisConnectionID;
                    }
                    for (var i = 0; i < CLIENTS.length; i++) {
                        CLIENTS[i].send(
                            JSON.stringify({
                                sender: "server",
                                command: "sendClientInfo",
                                data: {
                                    yourID: i,
                                    sigPadIDs: sigPadIDs,
                                },
                            })
                        );
                    }
                    break;

                case "requestPatronSignature":
                    var newData = obj.data;
                    newData.techConnectionID = thisConnectionID;
                    CLIENTS[sigPadIDs[obj.data.location]].send(
                        JSON.stringify({
                            sender: "tech",
                            command: "requestPatronSignature",
                            data: newData,
                        })
                    );
                    break;
                case "recievePatronSignature":
                    CLIENTS[obj.data.techConnectionID].send(
                        JSON.stringify({
                            sender: "server",
                            command: "requestAdminLogin",
                            data: obj.data,
                        })
                    );
                    break;
                case "recieveAdminLogin":
                    CLIENTS[sigPadIDs[obj.data.location]].send(
                        JSON.stringify({
                            sender: "server",
                            command: "resetScreen",
                        })
                    );

                    printHandler.markPickedUp(
                        obj.data.fileID,
                        obj.data.submissionID
                    );
                    break;
                default:
                    break;
            }
        });

        ws.on("close", function () {
            if (thisConnectionID == sigPadIDs.willis) {
                sigPadIDs.willis = -1;
            } else if (thisConnectionID == sigPadIDs.dp) {
                sigPadIDs.dp = -1;
            }
        });
    });
};
