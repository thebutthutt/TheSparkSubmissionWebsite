$(document).ready(function () {
    $.ajax({ type: 'GET', url: '/oneprint', dataType: 'html', success: function(data){ $('#files-list').append(data); } });

    $("#requestTypeSelector").change(function () {
        var requestType = $(this).children("option:selected").val();
        if (requestType == 'print') {
            $(".print-only").show();
        } else {
            $(".print-only").hide();
        }
    });

    $("#change").click(function() {
        $.ajax({ type: 'GET', url: '/oneprint', dataType: 'html', success: function(data){ $('#files-list').append(data); } });
    }); 

    
});