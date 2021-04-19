//WEBSOCKET FRONTEND LOGIC

var ws;
var fileName;
var signlocation;
var fileID;

var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}

function connectWebSocket() {
    ws = new WebSocket("wss://sparkorders.library.unt.edu:8080");
    ws.onopen = () => {
        if (signlocation == "willis") {
            ws.send("WillisSignaturePad");
        } else {
            ws.send("DPSignaturePad");
        }
    };

    $(".signature-pad").empty();
    waitscreen();

    ws.addEventListener("message", function (event) {
        var obj = JSON.parse(event.data);
        if (obj.command == "sendClientInfo") {
        } else if (obj.command == "requestPatronSignature") {
            fileID = obj.data.fileID;
            patronSignature();
        } else if (obj.command == "resetScreen") {
            $(".signature-pad").empty();
            waitscreen();
        }
    });
}

function handleVisibilityChange() {
    if (document[hidden]) {
        ws.close();
    } else {
        connectWebSocket();
    }
}

document.addEventListener(visibilityChange, handleVisibilityChange, false);

$(document).ready(function () {
    signlocation = $(".signature-pad").attr("signlocation");
    connectWebSocket();
});

var patronSignature = function () {
    $.ajax({
        url: "/signaturePad",
        data: {
            fileName: fileName,
        },
        dataType: "html",
    }).done(function (data) {
        $(".signature-pad").html(data);
        // =============
        // == Globals ==
        // =============
        const canvas = document.getElementById("drawing-area");
        const canvasContext = canvas.getContext("2d");

        canvasContext.canvas.width = window.innerWidth - 50;
        canvasContext.canvas.height = window.innerHeight - 300;

        canvasContext.fillStyle = "white";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        const clearButton = document.getElementById("clear-button");
        const state = {
            mousedown: false,
        };

        // ===================
        // == Configuration ==
        // ===================
        const lineWidth = 5;
        const strokeStyle = "#000";

        // =====================
        // == Event Listeners ==
        // =====================
        canvas.addEventListener("mousedown", handleWritingStart);
        canvas.addEventListener("mousemove", handleWritingInProgress);
        canvas.addEventListener("mouseup", handleDrawingEnd);
        canvas.addEventListener("mouseout", handleDrawingEnd);

        canvas.addEventListener("touchstart", handleWritingStart);
        canvas.addEventListener("touchmove", handleWritingInProgress);
        canvas.addEventListener("touchend", handleDrawingEnd);

        clearButton.addEventListener("click", handleClearButtonClick);

        // ====================
        // == Event Handlers ==
        // ====================
        function handleWritingStart(event) {
            event.preventDefault();

            const mousePos = getMosuePositionOnCanvas(event);

            canvasContext.beginPath();

            canvasContext.moveTo(mousePos.x, mousePos.y);

            canvasContext.lineWidth = lineWidth;
            canvasContext.strokeStyle = strokeStyle;
            canvasContext.lineCap = "round";
            canvasContext.lineJoin = "round";

            canvasContext.fill();

            state.mousedown = true;
        }

        function handleWritingInProgress(event) {
            event.preventDefault();

            if (state.mousedown) {
                const mousePos = getMosuePositionOnCanvas(event);

                canvasContext.lineTo(mousePos.x, mousePos.y);
                canvasContext.stroke();
            }
        }

        function handleDrawingEnd(event) {
            event.preventDefault();

            if (state.mousedown) {
                canvasContext.stroke();
            }

            state.mousedown = false;
        }

        function handleClearButtonClick(event) {
            event.preventDefault();

            clearCanvas();
        }

        // ======================
        // == Helper Functions ==
        // ======================
        function getMosuePositionOnCanvas(event) {
            const clientX = event.clientX || event.touches[0].clientX;
            const clientY = event.clientY || event.touches[0].clientY;
            const { offsetLeft, offsetTop } = event.target;
            const canvasX = clientX - offsetLeft;
            const canvasY = clientY - offsetTop;

            return {
                x: canvasX,
                y: canvasY,
            };
        }

        function clearCanvas() {
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        }

        $(".submit-button").on("click", function () {
            $.ajax({
                type: "POST",
                url: "/recievesignature",
                data: {
                    uniqueID: fileID,
                    fileName: fileName,
                },
            }).done(function () {
                clearCanvas();
                ws.send(
                    JSON.stringify({
                        sender: "messiah",
                        location: signlocation,
                        command: "recievePatronSignature",
                        data: {
                            fileID: fileID,
                        },
                    })
                );
                $(".signature-pad").empty();
                waitscreen();
            });
        });
    });
};

var waitscreen = function () {
    $.ajax({
        url: "/sigwaitscreen",
        dataType: "html",
    }).done(function (data) {
        $(".signature-pad").html(data);
    });
};
