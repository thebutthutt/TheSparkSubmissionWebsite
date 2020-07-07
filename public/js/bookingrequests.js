$(document).ready(function () {
    var currentSubmissionID;
    $('.btn-accept').on('click', function () {
        let submissionID = $(this).attr('submissionID');
        currentSubmissionID = submissionID;
        $('.modal').modal('show')
        $.ajax({
            type: 'GET',
            url: '/barcodes',
            data: {
                "submissionID": submissionID
            },
            dataType: 'html'
        }).done(function (data) {
            console.log('done')
            $('.modal-body').empty()
            $('.modal-body').append(data)
        });
    })

    $('.booking-confirm').on('click', function() {
        let submissionID = currentSubmissionID;
        $.ajax({
            type: 'POST',
            url: '/confirmbooking',
            data: {
                "submissionID": submissionID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });
});