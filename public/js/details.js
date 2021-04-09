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
    //initial form to show is an accepted ptint
    var initDecision = $("#decision").children("option:selected").val();
    console.log(initDecision);
    if (initDecision == "accepted") {
        $(".accepted-controls").show();
        $(".accepted-controls input").prop("required", true);
    } else {
        $(".accepted-controls").hide();
        $(".accepted-controls input").prop("required", false);
    }

    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="popover"]').popover();

    //setting up the download button to work
    $(".download-btn").on("click", function () {
        var fileLocation = $(this).attr("id");
        window.location = "/prints/download?fileID=" + fileLocation;
    });

    $(".btn-waive").on("click", function () {
        let fileID = $(this).attr("fileID");
        $.ajax({
            type: "POST",
            url: "/prints/waiveByFile",
            data: {
                fileID: fileID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".connect-button").on("click", function () {
        var location = $(this).attr("location");
        const ws = new WebSocket("wss://sparkorders.library.unt.edu");

        var printData = {
            fileName: $(".modal-button").attr("fileName"),
            fileID: $(".modal-button").attr("fileID"),
        };

        ws.onopen = () => {
            console.log("Now connected");

            ws.addEventListener("message", function (message) {
                var obj = JSON.parse(message.data);
                if (obj.command == "sendClientInfo") {
                    if (location == "willis") {
                        if (obj.data.willisID == -1) {
                            $(".asklocation").hide();
                            $(".nopad").show();
                            $(".asksig").hide();
                            $(".verify").hide();
                        } else {
                            $(".asklocation").hide();
                            $(".nopad").hide();
                            $(".asksig").show();
                            $(".verify").hide();
                            ws.send(
                                JSON.stringify({
                                    sender: "tech",
                                    location: location,
                                    command: "requestPatronSignature",
                                    data: printData,
                                })
                            );
                        }
                    } else {
                        if (obj.data.dpID == -1) {
                            $(".asklocation").hide();
                            $(".nopad").show();
                            $(".asksig").hide();
                            $(".verify").hide();
                        } else {
                            $(".asklocation").hide();
                            $(".nopad").hide();
                            $(".asksig").show();
                            $(".verify").hide();
                            ws.send(
                                JSON.stringify({
                                    sender: "tech",
                                    location: location,
                                    command: "requestPatronSignature",
                                    data: printData,
                                })
                            );
                        }
                    }
                } else if (obj.command == "requestAdminLogin") {
                    $(".asklocation").hide();
                    $(".nopad").hide();
                    $(".asksig").hide();
                    $(".verify").show();
                }
                if (message.data == "success") {
                    ws.close();
                    location.reload();
                } else {
                    if (obj.messiahID == -1) {
                        $(".asklocation").show();
                        $(".nopad").show();
                        $(".asksig").hide();
                        $(".verify").hide();
                    } else if (obj.messiahID != -1) {
                        ws.send(JSON.stringify(printData));
                    }
                }
            });

            $(".verification-button").click(function (e) {
                e.preventDefault();
                $.ajax({
                    type: "POST",
                    url: "/verify",
                    data: $(".verification").serialize(),
                }).always(function (data) {
                    if (data == "yes") {
                        $(".verification").hide();
                        ws.send(
                            JSON.stringify({
                                sender: "tech",
                                location: location,
                                command: "recieveAdminLogin",
                                data: printData,
                            })
                        );
                        ws.close();
                        $(".modal").modal("hide");
                    } else {
                        //verification failed
                        $(".wrong-password").show();
                    }
                });
            });
        };
    });

    $(".modal").on("hidden.bs.modal", function (e) {
        location.reload();
    });

    $(".pickup-btn").on("click", function () {
        let fileID = $(this).attr("fileid");
        $.ajax({
            type: "POST",
            url: "/prints/markPickedUp",
            data: {
                fileID: fileID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    //which set of form items to show based on accepted or rejected print
    $("#decision").change(function () {
        var requestType = $(this).children("option:selected").val();
        if (requestType == "accepted") {
            $(".accepted-controls").show();
            $(".accepted-controls input").prop("required", true);
        } else {
            $(".accepted-controls").hide();
            $(".accepted-controls input").prop("required", false);
        }
        //may change if other request types need extra options
    });

    $(".custom-file-input").on("change", function () {
        if (
            $(this)
                .val()
                .substring($(this).val().length - 6)
                .toUpperCase() != ".GCODE"
        ) {
            $(this).attr("type", "text");
            $(this).attr("type", "file");
            $(this).popover({
                trigger: "focus",
            });
            $(this).popover("show");
        } else {
            $(this).popover("hide");
            let fileName = $(this).val().split("\\").pop();
            $(this)
                .siblings(".custom-file-label")
                .addClass("selected")
                .html(fileName);
        }
    });

    $(".change-btn").on("click", function () {
        let fileID = $(this).attr("fileid");
        $.ajax({
            type: "POST",
            url: "/prints/changeLocation",
            data: {
                fileID: fileID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".start-print").on("click", function () {
        let fileID = $(this).attr("fileid");
        $.ajax({
            type: "POST",
            url: "/prints/startprint",
            data: {
                fileID: fileID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".markCopiesPrinting").on("click", function (e) {
        e.preventDefault();
        let fileID = $(this).attr("fileid");
        var copiesPrinting = $("#inlineFormInputCopies").val();
        $.ajax({
            type: "POST",
            url: "/prints/markPrinting",
            data: {
                fileID: fileID,
                copiesPrinting: copiesPrinting,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".print-success").on("click", function () {
        let fileID = $(this).attr("fileid");
        var copiesPrinting = $(".copiesPrinting").attr("numCopiesPrinting");

        $.ajax({
            type: "POST",
            url: "/prints/printsuccess",
            data: {
                fileID: fileID,
                copiesPrinting: copiesPrinting,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".print-fail").on("click", function () {
        let fileID = $(this).attr("fileid");
        $.ajax({
            type: "POST",
            url: "/prints/printfail",
            data: {
                fileID: fileID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".submitRealGrams").on("click", function () {
        let fileID = $(this).attr("fileid");
        var realGrams = $("#inlineFormRealGrams").val();
        $.ajax({
            type: "POST",
            url: "/prints/printcomplete",
            data: {
                fileID: fileID,
                realGrams: realGrams,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });
});
