const ws = new WebSocket("wss://sparkorders.library.unt.edu");
var fileName;
var fileID;

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split("&"),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined
        ? true
        : decodeURIComponent(sParameterName[1]);
    }
  }
};

$(document).ready(function () {
  ws.onopen = () => {
    ws.send("I am the messiah");
    console.log("Now connected");
  };

  ws.addEventListener("message", function (event) {
    console.log("Message from server ", event.data);
    var obj = JSON.parse(event.data);
    if (obj.sender == "tech") {
      fileName = obj.fileName;
      fileID = obj.fileID;
      initialise();
    }
  });
});

var initialise = function () {
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
      var dataURL = canvas.toDataURL("image/jpeg", 0.1);
      $.ajax({
        type: "POST",
        url: "/recievesignature",
        data: {
          uniqueID: fileID,
          fileName: fileName,
          dataURL: dataURL,
        },
      }).done(function () {
        clearCanvas();
        ws.send(
          JSON.stringify({
            sender: "messiah",
            fileID: fileID,
          })
        );
        $(".signature-pad").empty();
      });
    });
  });
};
