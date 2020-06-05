$(document).ready(function () {
    $('.delete-account').on('click', function () {
        console.log('clicked');
        var userID = $(this).attr('userID');
        window.location = '/accounts/delete?userID=' + userID;
    });
});