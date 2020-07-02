var addOne = function () {
    $.ajax({
        type: 'GET',
        url: '/oneprint',
        dataType: 'html',
        success: function (data) {
            $('#files-list').append(data);
            $('.custom-file-input').on('change', function () {
                let fileName = $(this).val().split('\\').pop();
                $(this).siblings('.custom-file-label').addClass("selected").html(fileName);
            });
        }
    });
}

var addOneOther = function () {
    $.ajax({
        type: 'GET',
        url: '/onefile',
        dataType: 'html',
        success: function (data) {
            $('#files-list-other').append(data);
            $('.custom-file-input').on('change', function () {
                let fileName = $(this).val().split('\\').pop();
                $(this).siblings('.custom-file-label').addClass("selected").html(fileName);
            });
        }
    });
}

$(document).ready(function () {
    var numPrints = 1;
    var requestType = 'print';
    //this inserts the first 3d print file segment
    $("#submission-form").attr("action", "/submitprint");
    $("#files-list-other").empty();
    $(".non-print").hide();
    $(".print-only").show();
    addOne();
    $(".print-only input").prop('required', true);

    //this hides the 3d print specific section of the form when the dropdown isnt 3d print
    $("#requestTypeSelector").change(function () {
        requestType = $(this).children("option:selected").val();
        if (requestType == 'print') {
            $("#submission-form").attr("action", "/submitprint");
            $("#files-list-other").empty();
            $(".non-print").hide();
            $(".print-only").show();
            addOne();
            $(".print-only input").prop('required', true);
        } else {
            $("#submission-form").attr("action", "/submitcle");
            $("#files-list").empty();
            $(".print-only").hide();
            $(".non-print").show();
            $(".print-only input").prop('required', false);
        }
    });

    //adds new 3d print section when add another button is clicked
    $("#change").click(addOne);

    //adds new file section when add another button is clicked
    $("#change-other").click(addOneOther);

    //removes the last 3d print file segment when the remove one button is clicked
    $("#remove-other").click(function () {
        $(".single-file:last").remove();
    });

    //removes the last 3d print file segment when the remove one button is clicked
    $("#remove").click(function () {
        $(".single-print:last").remove();
    });

});

$(document).on('submit','#submission-form',function(){
    $('.modal').modal('show');
 });