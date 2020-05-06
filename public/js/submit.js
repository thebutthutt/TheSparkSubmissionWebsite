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

$(document).ready(function () {
    var numPrints = 1;
    //this inserts the first 3d print file segment
    addOne();

    //this hides the 3d print specific section of the form when the dropdown isnt 3d print
    $("#requestTypeSelector").change(function () {
        var requestType = $(this).children("option:selected").val();
        if (requestType == 'print') {
            console.log('printinf');
            $(".print-only").show();
            addOne();
            $(".print-only input").prop('required', true);
        } else {
            $("#files-list").empty();
            $(".print-only").hide();
            $(".print-only input").prop('required', false);
        }
        //may change if other request types need extra options
    });

    //adds new 3d print section when add another button is clicked
    $("#change").click(addOne);

    //removes the last 3d print file segment when the remove one button is clicked
    $("#remove").click(function () {
        $(".single-print:last").remove();
    });
    
});