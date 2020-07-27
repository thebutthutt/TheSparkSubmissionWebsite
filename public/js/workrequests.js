$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
  $(".remove-btn").on("click", function () {
    var submissionID = $(this).attr("id");
    $.ajax({
      method: "POST",
      url: "/workrequests/delete",
      data: {
        submissionID: submissionID,
      },
      dataType: "json",
    }).done(function () {
      location.reload();
    });
  });

  $(".download-by-name").on("click", function () {
    var fileName = $(this).attr("filename");
    window.location = "/workrequests/download?fileName=" + fileName;
  });

  $(".claim-btn").on("click", function () {
    let submissionID = $(this).attr("id");
    $.ajax({
      type: "POST",
      url: "/workrequests/claim",
      data: {
        submissionID: submissionID,
      },
      dataType: "json",
    }).done(function () {
      location.reload();
    });
  });

  $(".delete-file-btn").on("click", function () {
    let fileName = $(this).attr("id");
    $.ajax({
      type: "POST",
      url: "/workrequests/deletefile",
      data: {
        fileName: fileName,
      },
      dataType: "json",
    }).done(function () {
      location.reload();
    });
  });

  $(".material-intake-btn").on("click", function () {
    let submissionID = $(this).attr("submissionID");
    $(".modal").modal("show");
    $(".modal form").attr(
      "action",
      "/workrequests/materialintake?submissionID=" + submissionID
    );
  });
});
