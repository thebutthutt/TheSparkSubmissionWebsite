$(document).ready(function () {
    $('.download-btn').on('click', function () {
        var fileID = $(this).attr('id');
        console.log('click');
        window.location = '/prints/download?fileID=' + fileID;
    });
});