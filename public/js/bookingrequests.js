$(document).ready(function () {
    var currentSubmissionID;
    $('.btn-accept').on('click', function () {
        let submissionID = $(this).attr('submissionID');
        currentSubmissionID = submissionID;
        $('.modal').modal('show')
        $.ajax({
            type: 'GET',
            url: '/bookings/barcodes',
            data: {
                "submissionID": submissionID
            },
            dataType: 'html'
        }).done(function (data) {
            console.log('done')
            $('.modal-body').empty()
            $('.modal-body').append(data)
        });
    });

    $('.btn-delete').on('click', function () {
        var submissionID = $(this).attr('submissionID');
        $.ajax({
            type: 'POST',
            url: '/bookings/deletebooking',
            data: {
                "submissionID": submissionID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    })

    $('.booking-confirm').on('click', function() {
        let submissionID = currentSubmissionID;
        $.ajax({
            type: 'POST',
            url: '/bookings/confirmbooking',
            data: {
                "submissionID": submissionID
            },
            dataType: 'json'
        }).done(function () {
            location.reload();
        });
    });
});