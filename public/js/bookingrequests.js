$(document).ready(function () {
    var currentSubmissionID;
    $(".btn-accept").on("click", function () {
        let submissionID = $(this).attr("submissionID");
        currentSubmissionID = submissionID;
        $(".modal").modal("show");
        $.ajax({
            type: "POST",
            url: "/bookings/verifyavailable",
            data: {
                submissionID: submissionID,
            },
            dataType: "html",
        }).done(function (data) {
            $(".modal-body").append(data);
        });

        $(".booking-confirm").on("click", function () {
            let submissionID = currentSubmissionID;
            $.ajax({
                type: "POST",
                url: "/bookings/confirmbooking",
                data: {
                    submissionID: submissionID,
                },
                dataType: "json",
            }).done(function () {
                location.reload();
            });
        });

        $(".booking-reject").on("click", function () {
            let submissionID = currentSubmissionID;
            $.ajax({
                type: "POST",
                url: "/bookings/rejectbooking",
                data: {
                    submissionID: submissionID,
                },
                dataType: "json",
            }).done(function () {
                location.reload();
            });
        });
    });

    $(".btn-delete").on("click", function () {
        var submissionID = $(this).attr("submissionID");
        $.ajax({
            type: "POST",
            url: "/bookings/deletebooking",
            data: {
                submissionID: submissionID,
            },
            dataType: "json",
        }).done(function () {
            location.reload();
        });
    });

    $(".modal").on("hidden.bs.modal", function (e) {
        $(".modal-body").empty();
    });
});
