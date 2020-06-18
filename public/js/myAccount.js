var fillSuper = function () {
    showActionQueue();
    showUsers();
}

var showActionQueue = function () {
    $.ajax({
        type: 'GET',
        url: '/printsPendingDelete',
        dataType: 'html',

        success: function (data) {
            if (data.length != 0) {
                $('.appendDeleteHere').empty().append(data);

                $('.btn-delete').on('click', function () {
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

        }
    });

    $.ajax({
        type: 'GET',
        url: '/printsPendingWaive',
        dataType: 'html',
        success: function (data) {
            if (data.length != 0) {
                $('.appendWaiveHere').empty().append(data);
                $('.btn-waive').on('click', function () {
                    var itemID = $(this).attr('itemID');
                    $.ajax({
                        method: "POST",
                        url: "/prints/waive",
                        data: {
                            "submissionID": itemID
                        },
                        dataType: "json"
                    }).done(function () {
                        location.reload();
                    });
                });
            }
        }
    });
}

var showUsers = function () {
    $.ajax({
        type: 'GET',
        url: '/allUsers',
        dataType: 'html',
        data: {
            "myeuid": $(".hidden-extras").attr('myeuid')
        },
        success: function (data) {
            if (data.length != 0) {
                $('.appendUsersHere').empty().append(data);
                $('.btn-user-delete').on('click', function () {
                    var euid = $(this).attr('euid');
                    $.ajax({
                        method: "POST",
                        url: "/users/delete",
                        data: {
                            "euid": euid
                        },
                        dataType: "json"
                    }).done(function () {
                        location.reload();
                    });
                });

                $('.btn-user-promote').on('click', function () {
                    var euid = $(this).attr('euid');
                    $.ajax({
                        method: "POST",
                        url: "/users/promote",
                        data: {
                            "euid": euid
                        },
                        dataType: "json"
                    }).done(function () {
                        location.reload();
                    });
                });

                $('.btn-user-demote').on('click', function () {
                    var euid = $(this).attr('euid');
                    $.ajax({
                        method: "POST",
                        url: "/users/demote",
                        data: {
                            "euid": euid
                        },
                        dataType: "json"
                    }).done(function () {
                        location.reload();
                    });
                });
            }
        }
    });
}

$(document).ready(function () {
    $('.delete-account').on('click', function () {
        var userID = $(this).attr('userID');
        window.location = '/accounts/delete?userID=' + userID;
    });

    if ($('.hidden-extras').attr('isSuperAdmin') == "true") {
        fillSuper();
    } else {}
});