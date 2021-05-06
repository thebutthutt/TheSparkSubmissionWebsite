$(document).ready(function () {
    //initial form to show is an accepted ptint

    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="popover"]').popover();

    //setting up the download button to work
    $(".download-btn").on("click", function () {
        var fileLocation = $(this).attr("id");
        window.location = "/prints/download?fileID=" + fileLocation;
    });
});
