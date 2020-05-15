$(document).ready(function () {
    //initial form to show is an accepted ptint
    $(".accepted-controls").show();
    $(".accepted-controls input").prop('required', true);


    //setting up the download button to woro
    $('.download-btn').on('click', function () {
        var fileLocation = $(this).attr('location');
        console.log('click');
        window.location = '/prints/download?fileID=' + fileLocation;
    });


    //which set of form items to show based on accepted or rejected print
    $("#decision").change(function () {
        var requestType = $(this).children("option:selected").val();
        if (requestType == 'accepted') {
            $(".accepted-controls").show();
            $(".accepted-controls input").prop('required', true);
        } else {
            $(".accepted-controls").hide();
            $(".accepted-controls input").prop('required', false);
        }
        //may change if other request types need extra options
    });

    $('.custom-file-input').on('change', function () {
        let fileName = $(this).val().split('\\').pop();
        $(this).siblings('.custom-file-label').addClass("selected").html(fileName);
    });

    $('.change-btn').on('click', function () {
        let fileID = $(this).attr('fileID');
        $.ajax({
            type: 'POST',
            url: '/prints/changeLocation',
            data: {
                "fileID": fileID
            },
            dataType: 'json'
        }).done(function () {
            console.log('done');
            location.reload();
        });
    })
});