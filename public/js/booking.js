var getAvailableCameras = function(startDate, endDate) {
    $.ajax({
        type: 'POST',
        url: '/bookings/availableon',
        data: {
            "startDate": startDate,
            "endDate": endDate,
        },
        success: function (data) {
            if (data[0].length > 0) {
                $('#availableCameras').empty();
            }

            if (data[1].length > 0) {
                $('#availableLenses1').empty();
                $('#availableLenses2').empty();
            }

            data[0].forEach(element => {
                $('#availableCameras').append($('<option/>', { 
                    value: element,
                    text : element
                }));
            });

            data[1].forEach(element => {
                $('#availableLenses1').append($('<option/>', { 
                    value: element,
                    text : element
                }));

                $('#availableLenses2').append($('<option/>', { 
                    value: element,
                    text : element
                }));
            });

            $('#availableLenses2').append($('<option/>', { 
                value: "None",
                text : "None"
            }));
            
        }
    });
}

$(document).ready(function () {
    var startDate, endDate;
    $("#startDate").change(function () {
        startDate = new Date($("#startDate").val());
        endDate = new Date($("#startDate").val());
        endDate.setDate(endDate.getDate() + 3);
        $("#endDate").val(endDate.toISOString().substring(0, 10));
        getAvailableCameras(startDate.toISOString().substring(0, 10), endDate.toISOString().substring(0, 10));
    });
});