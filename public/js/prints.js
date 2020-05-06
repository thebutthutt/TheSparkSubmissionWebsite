$(document).ready(function () {
    console.log('ready');
    $('.remove-btn').on('click', function () {
        console.log('click');
        var userId = $(this).attr('id');
        $.ajax({
            method: "POST",
            url: "/prints/delete",
            data: {
                "userId": userId
            },
            success: function (result) {
                console.log('done');

                location.reload();
            }
        });
    });
});