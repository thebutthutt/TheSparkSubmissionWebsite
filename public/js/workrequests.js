$(document).ready(function () {
    $('.remove-btn').on('click', function () {
        var submissionID = $(this).attr('id');
        $.ajax({
            method: "POST",
            url: "/workrequests/delete",
            data: {
                "submissionID": submissionID
            },
            dataType: "json"
        }).done(function () {
            location.reload();
        });
    });

    $('.download-btn').on('click', function () {
        var fileID = $(this).attr('id');
        window.location = '/workrequests/download?fileID=' + fileID;
    });

    $('.claim-btn').on('click', function () {
        let submissionID = $(this).attr('id');
        $.ajax({
            type: 'POST',
            url: '/workrequests/claim',
            data: {
                "submissionID": submissionID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });

    $('.delete-file-btn').on('click', function () {
        let fileName = $(this).attr('id');
        $.ajax({
            type: 'POST',
            url: '/workrequests/deletefile',
            data: {
                "fileName": fileName
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });
});