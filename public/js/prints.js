$(document).ready(function () {
    console.log('ready');
    $('.delete-btn').on('click', function () {
        var userId = $(this).attr('id');
        $.ajax({
            method: "POST",
            url: "/prints/delete",
            data: {
                "userId": userId
            },
            dataType: "json"
        }).done(function() {
            console.log('done');
            location.reload();
        });
    });

    $('.download-btn').on('click', function () {
        var fileID = $(this).attr('id');
        window.location = '/prints/download?fileID=' + fileID;
    });
});