var showActionQueue = function () {
    $.ajax({
        type: 'GET',
        url: '/printsPendingDelete',
        dataType: 'html',
        success: function (data) {
            $('#actionQueue').append(data);

            $('.btn-delete').on('click', function () {
                console.log('click');
                var fileID = $(this).attr('fileID');
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
            });
        }
    });
}

$(document).ready(function () {
    $('.delete-account').on('click', function () {
        console.log('clicked');
        var userID = $(this).attr('userID');
        window.location = '/accounts/delete?userID=' + userID;
    });

    if ($('.delete-account').attr('isSuperAdmin') == "true") {
        showActionQueue();

    } else {}
});