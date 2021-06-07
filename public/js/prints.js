window.addEventListener("pageshow", function (event) {
    var historyTraversal =
        event.persisted ||
        (typeof window.performance != "undefined" &&
            window.performance.navigation.type === 2);
    if (historyTraversal) {
        // Handle page restore.
        window.location.reload();
    }
});

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $(".delete-btn").on("click", function () {
        var fileID = $(this).attr("id");
        var isSuperAdmin = $(this).attr("issuperadmin");

        if (isSuperAdmin == "true") {
            //attributes come over as strings not booleans!!
            $.ajax({
                method: "POST",
                url: "/prints/delete",
                data: {
                    fileID: fileID,
                },
                dataType: "json",
            }).done(function () {
                location.reload();
            });
        } else {
            $.ajax({
                method: "POST",
                url: "/prints/requestdelete",
                data: {
                    fileID: fileID,
                },
                dataType: "json",
            }).done(function () {
                location.reload();
            });
        }
    });

    $(".undo-delete-btn").on("click", function () {
        var fileID = $(this).attr("id");
        $.ajax({
            method: "POST",
            url: "/prints/undodelete",
            data: {
                fileID: fileID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".download-btn").on("click", function () {
        var fileID = $(this).attr("id");
        window.location = "/prints/download?fileID=" + fileID;
    });

    $(".zip-btn").on("click", function () {
        var submissionID = $(this).attr("id");
        window.location =
            "/prints/downloadSubmission?submissionID=" + submissionID;
    });

    $(".preview-btn").on("click", function () {
        var fileID = $(this).attr("id");
        window.location = "/prints/preview?fileID=" + fileID;
    });

    $(".submit-btn").on("click", function () {
        console.log("submit");
        let submissionID = $(this).attr("id");
        $.ajax({
            type: "POST",
            url: "/prints/requestPayment",
            data: {
                submissionID: submissionID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".resend-btn").on("click", function () {
        let submissionID = $(this).attr("submissionID");
        console.log(submissionID);
        $.ajax({
            type: "POST",
            url: "/prints/requestPayment",
            data: {
                submissionID: submissionID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".waive-btn").on("click", function () {
        let submissionID = $(this).attr("submissionID");
        var isSuperAdmin = $(this).attr("issuperadmin");

        if (isSuperAdmin == "true") {
            //attributes come over as strings not booleans!!
            $.ajax({
                method: "POST",
                url: "/prints/waive",
                data: {
                    submissionID: submissionID,
                },
                dataType: "json",
            }).done(function () {
                location.reload();
            });
        } else {
            $.ajax({
                method: "POST",
                url: "/prints/requestwaive",
                data: {
                    submissionID: submissionID,
                },
                dataType: "json",
            }).done(function () {
                location.reload();
            });
        }
    });

    $(".undo-waive-btn").on("click", function () {
        let submissionID = $(this).attr("id");
        $.ajax({
            method: "POST",
            url: "/prints/undowaive",
            data: {
                submissionID: submissionID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".finish-printing").on("click", function () {
        let fileID = $(this).attr("id");
        $.ajax({
            type: "POST",
            url: "/prints/finishPrinting",
            data: {
                fileID: fileID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".clear-btn").on("click", function () {
        $.ajax({
            type: "POST",
            url: "/prints/clearAllCompleted",
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".clear-rejected-btn").on("click", function () {
        $.ajax({
            type: "POST",
            url: "/prints/clearAllRejected",
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });
});
