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

    $('.preview-btn').on('click', function () {
        var fileID = $(this).attr('id');
        window.location = '/prints/preview?fileID=' + fileID;
    });

    $('.edit-btn').on('click', function () {
        var fileID = $(this).attr('id');
        window.location = '/prints/edit?fileID=' + fileID;
    });
    $('.submit-btn').on('click', function () {
        let submissionID = $(this).attr('id');
        $.ajax({
          type: 'POST',
          url: '/prints/requestPayment',
          data: {
            "submissionID": submissionID
          },
          dataType: 'json'
        });
      });
});