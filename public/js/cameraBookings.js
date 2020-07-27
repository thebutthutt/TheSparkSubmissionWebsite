var getBookingInfo = function (event) {
    $.ajax({
        type: "GET",
        url: "/bookings/getBookingDetails",
        data: {
            title: event.title,
            start: event.start,
            end: event.end,
        },
        dataType: "html",
        success: function (data) {
            $(".modal-body > p").append(data);
        },
    });
};

document.addEventListener("DOMContentLoaded", function () {
    //setup the calendar
    var calendarEl = document.getElementById("calendar");
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        height: 800,
        selectable: false,
        themeSystem: "bootstrap",
        buttonText: { today: "Today" },
        select: function (info) {
            alert("Clicked on: " + info.startStr + "to" + info.endStr);
        },
        eventSources: [
            {
                url: "/bookings",
                method: "POST",
                failure: function () {
                    alert("there was an error while fetching events!");
                },
            },
        ],
        eventClick: function (info) {
            getBookingInfo(info.event);
            $(".modal").modal("show");
        },
    });

    calendar.render();

    //manual event entry end date default setter
    $("#startDate").change(function () {
        var endDate = new Date($("#startDate").val());
        endDate.setDate(endDate.getDate() + 3);
        if (endDate.getDay() == 6) {
            //if 4 days lands on a sunday, make it monday
            endDate.setDate(endDate.getDate() + 1); //add 1 day
        } else if (endDate.getDay() == 5) {
            //if 4 days lands on a saturday, make it monday
            endDate.setDate(endDate.getDate() + 2); //add 2 days
        }
        $("#endDate").val(endDate.toISOString().substring(0, 10));
    });

    //switching between filters and manual event entry
    $("#editor").on("click", function () {
        $("#filter-list").hide();
        $("#editor-controls").show();
    });

    $("#filters").on("click", function () {
        $("#editor-controls").hide();
        $("#filter-list").show();
    });

    //resets filters to all on month changes
    $(".fc-next-button").on("click", function () {
        $(".nav-link-all").click();
    });

    $(".fc-prev-button").on("click", function () {
        $(".nav-link-all").click();
    });

    //fades out calendar events that dont contain the item selected
    $(".filter-item").on("click", function () {
        if (this.innerHTML == "All") {
            $(".fc-daygrid-event").fadeTo("fast", 1);
        } else {
            var newClass = this.innerHTML.replace(/\W/g, "");
            $(".fc-daygrid-event:not(." + newClass + ")").fadeTo("fast", 0.33);
            $("." + newClass).fadeTo("fast", 1);
        }
    });
});
