$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.delete-btn').on('click', function () {
        var fileID = $(this).attr('id');
        var isSuperAdmin = $(this).attr('issuperadmin');

        if (isSuperAdmin == "true") { //attributes come over as strings not booleans!!
            console.log("fully delete");
            $.ajax({
                method: "POST",
                url: "/prints/delete",
                data: {
                    "fileID": fileID
                },
                dataType: "json"
            }).done(function () {
                location.reload();
            });
        } else {
            console.log("pending delete");
            $.ajax({
                method: "POST",
                url: "/prints/requestdelete",
                data: {
                    "fileID": fileID
                },
                dataType: "json"
            }).done(function () {
                location.reload();
            });
        }
        
    });

    $('.undo-delete-btn').on('click', function () {
        var fileID = $(this).attr('id');
        $.ajax({
            method: "POST",
            url: "/prints/undodelete",
            data: {
                "fileID": fileID
            },
            dataType: "json"
        }).done(function () {
            location.reload();
        });
    });

    $('.download-btn').on('click', function () {
        var fileID = $(this).attr('id');
        window.location = '/prints/download?fileID=' + fileID;
    });

    $('.preview-btn').on('click', function () {
        var fileID = $(this).attr('id');
        window.location = '/prints/preview?fileID=' + fileID;
    });

    $('.submit-btn').on('click', function () {
        console.log("yes?");
        let submissionID = $(this).attr('id');
        $.ajax({
            type: 'POST',
            url: '/prints/requestPayment',
            data: {
                "submissionID": submissionID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });

    $('.waive-btn').on('click', function () {
        let submissionID = $(this).attr('id');
        var isSuperAdmin = $(this).attr('issuperadmin');

        if (isSuperAdmin == "true") { //attributes come over as strings not booleans!!
            console.log("fully delete");
            $.ajax({
                method: "POST",
                url: "/prints/waive",
                data: {
                    "submissionID": submissionID
                },
                dataType: "json"
            }).done(function () {
                location.reload();
            });
        } else {
            console.log("pending delete");
            $.ajax({
                method: "POST",
                url: "/prints/requestwaive",
                data: {
                    "submissionID": submissionID
                },
                dataType: "json"
            }).done(function () {
                location.reload();
            });
        }
    });
});