var showActionQueue = function () {
    $.ajax({
        type: 'GET',
        url: '/pendingDelete',
        dataType: 'html',
        success: function (data) {
            $('#actionQueue').append(data);
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
    } else {
    }
});