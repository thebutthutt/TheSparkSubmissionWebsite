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
    /*
    var dtToday = new Date();

    var month = dtToday.getMonth() + 1;
    var day = dtToday.getDate();
    var year = dtToday.getFullYear();

    if(month < 10)
        month = '0' + month.toString();
    if(day < 10)
        day = '0' + day.toString();

    var minDate = year + '-' + month + '-' + day;    
    $('#startDate').attr('min', minDate);*/

    const endInput = datepicker('#endDate');
    const startInput = datepicker('#startDate', { 
        noWeekends: true,
        onHide: instance => {
            console.log('changed')
            endDate = new Date(instance.dateSelected);
            endDate.setDate(endDate.getDate() + 3);

            if (endDate.getDay() == 0) {                    //if 4 days lands on a sunday, make it monday
                endDate.setDate(endDate.getDate() + 1);     //add 1 day
            } else if (endDate.getDay() == 6) {             //if 4 days lands on a saturday, make it monday
                endDate.setDate(endDate.getDate() + 2);     //add 2 days
            }

            endInput.setDate(endDate);
            getAvailableCameras(startDate, endDate)
        } 
    });
});