$(document).ready(function () {
    //initial form to show is an accepted ptint
    $(".accepted-controls").show();
    $(".accepted-controls input").prop('required', true);
    $('[data-toggle="tooltip"]').tooltip();

    //setting up the download button to work
    $('.download-btn').on('click', function () {
        var fileLocation = $(this).attr('id');
        window.location = '/prints/download?fileID=' + fileLocation;
    });

    $('.pickup-btn').on('click', function () {
        console.log('hello')
        let fileID = $(this).attr('fileid');
        $.ajax({
            type: 'POST',
            url: '/prints/markPickedUp',
            data: {
                "fileID": fileID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
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
        if ($(this).val().substring($(this).val().length - 4) != '.gcode' || $(this).val().substring($(this).val().length - 4) != '.GCODE' ) {
            $(this).attr('type', 'text')
            $(this).attr('type', 'file')
            $(this).popover({
                trigger: 'focus'
            })
            $(this).popover('show');
        } else {
            $(this).popover('hide');
            let fileName = $(this).val().split('\\').pop();
            $(this).siblings('.custom-file-label').addClass("selected").html(fileName);
        }
    });

    $('.change-btn').on('click', function () {
        let fileID = $(this).attr('fileid');
        $.ajax({
            type: 'POST',
            url: '/prints/changeLocation',
            data: {
                "fileID": fileID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });

    $('.modal').on('shown.bs.modal', function() {
        $('#patronSwipe').focus();
    });

    $('.start-print').on('click', function () {
        let fileID = $(this).attr('fileid');
        $.ajax({
            type: 'POST',
            url: '/prints/startprint',
            data: {
                "fileID": fileID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });

    $('.print-success').on('click', function () {
        let fileID = $(this).attr('fileid');
        $.ajax({
            type: 'POST',
            url: '/prints/printsuccess',
            data: {
                "fileID": fileID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });

    $('.print-fail').on('click', function () {
        let fileID = $(this).attr('fileid');
        $.ajax({
            type: 'POST',
            url: '/prints/printfail',
            data: {
                "fileID": fileID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });

    

});

