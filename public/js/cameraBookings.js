var getBookingInfo = function (event) {
  $.ajax({
    type: 'GET',
    url: '/bookings/getBookingDetails',
    data: {
      "title": event.title,
      "start": event.start,
      "end": event.end
    },
    dataType: 'json',
    success: function(res) {
      console.log(res)
      $('.modal-body > p').html(res);
    }
  })
}

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 800,
      selectable: false,
      themeSystem: 'bootstrap',
      select: function(info) {
        alert('Clicked on: ' + info.startStr + 'to' + info.endStr);
      },
      eventSources: [
        {
            url: '/bookings',
            method: 'POST',
            failure: function() {
                alert('there was an error while fetching events!');
            }
        }
      ],
      eventClick: function(info) {
        getBookingInfo(info.event);
        $('.modal').modal('show');
      }
    });

    calendar.render();

    $("#startDate").change(function () {
        var endDate = new Date($("#startDate").val());
        endDate.setDate(endDate.getDate() + 3);
        $("#endDate").val(endDate.toISOString().substring(0, 10));
    });

    $('#editor').on('click', function () {
      $('#filter-list').hide();
      $('#editor-controls').show();
    });

    $('#filters').on('click', function () {
      $('#editor-controls').hide();
      $('#filter-list').show();
    });

    $('.filter-item').on('click', function () {
      if (this.innerHTML == "All") {
        $('.fc-daygrid-event').fadeTo("fast", 1);
      } else {
        var newClass = this.innerHTML.replace(/\W/g, '');
        $('.fc-daygrid-event:not(.'+ newClass +')').fadeTo("fast", 0.33);
        $('.'+newClass).fadeTo("fast", 1);
      }
    });
});