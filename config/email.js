var nodemailer = require("nodemailer");
var smtpserver = "mailhost.unt.edu";
var portNum = 25;

var transporter = nodemailer.createTransport({
    host: smtpserver,
    port: portNum,
    secure: false,
    tls: {
        rejectUnauthorized: false,
    },
});

module.exports = {
    requestPayment: async function (email, acceptedFiles, acceptedMessages, rejectedFiles, rejectedMessages, link) {
        var fullEmail = `Thank you for your 3D print request with The Spark Makerspace.
            <br><br>
            Our team has reviewed your request and we are ready to print your files. Please follow the link below to complete your payment, and our team will begin printing your files as they arrived in the queue.
            <br><br>
            These files were accepted:
            <ul>
            `;

        for (var i = 0; i < acceptedFiles.length; i++) {
            fullEmail += `<li>${acceptedFiles[i]}<br> \"${acceptedMessages[i]}\" </li>`;
        }

        fullEmail += `</ul>`;

        if (rejectedFiles.length > 0) {
            fullEmail += `<br>These files were rejected:
                <ul>`;

            for (var i = 0; i < rejectedFiles.length; i++) {
                fullEmail += `<li>${rejectedFiles[i]}<br> \"${rejectedMessages[i]}\" </li>`;
            }

            fullEmail += `</ul>`;
        }

        fullEmail += `Here is the link to pay for your accepted files:<br>
            <a href=\"${link}\">https://payments.library.unt.edu/</a>
            <br><br>
            After completing your payment, you will recieve an email when your models have been printed. This usually takes between 5 and 7 business days, however, during senior design season, we may be unusually busy. We will try our best to print all our requests as quickly as possible without sacrificing quality. Thank you for chosing The Spark Makerspace!
            `;

        var email = await transporter.sendMail({
            from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
            to: email,
            subject: "Your order has been accepted!",
            html: fullEmail,
        });
    },

    fullyRejected: async function (email, rejectedFiles, rejectedMessages) {
        var fullEmail = `Thank you for your 3D print request with The Spark Makerspace.
            <br><br>
            Our team has reviewed your request, and we are sorry to tell you we could not print any of your files. The notes on each of the files are listed below:
            <ul>
            `;

        for (var i = 0; i < rejectedFiles.length; i++) {
            fullEmail += `<li>${rejectedFiles[i]} \"${rejectedMessages[i]}\" </li>`;
        }

        fullEmail += `</ul>
            <br><br>
            Please feel free to resubmit any files you can fix and we will be happy to review them again!
            <br>
            <a href=\"https://sparkorders.library.unt.edu/submit\"></a>`;

        var email = await transporter.sendMail({
            from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
            to: email,
            subject: "We could not print your order",
            html: fullEmail,
        });
        console.log("emailSend");
    },

    paymentWaived: async function (email) {
        var fullEmail = `Thank you for your 3D print request with The Spark Makerspace.
            <br><br>
            We have waived the payment for your models and they are now in our printing queue! You will recieve an email when your models are sucessfully printed.`;

        var email = await transporter.sendMail({
            from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
            to: email,
            subject: "Your Payment Has Been Waived",
            html: fullEmail,
        });
        console.log("emailSend");
    },
    readyToPrint: async function (email) {
        var fullEmail = `Thank you for your 3D print request with The Spark Makerspace.
            <br><br>
            We have recieved the payment for your models and they are now in our printing queue! You will recieve an email when your models are sucessfully printed.`;

        var email = await transporter.sendMail({
            from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
            to: email,
            subject: "Your Payment Has Been Recieved",
            html: fullEmail,
        });
        console.log("emailSend");
    },
    readyForPickup: async function (email, fileName) {
        var fullEmail = `Thank you for your 3D print request with The Spark Makerspace.
            <br><br>
            Your file has finished printing and is now ready for you to pick up! Come by The Spark Makerspace any time we are open to pick up your print. Please note that we may not have completed every file in your submission yet, but you will recieve an email every time a file has completed with the name of the file that was completed. The file we have just finished printing is `;
        fullEmail += fileName;

        var email = await transporter.sendMail({
            from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
            to: email,
            subject: "Your Print Is Complete!",
            html: fullEmail,
        });

        console.log("emailSend");
    },
    stillWaiting: async function (email, fileNames) {
        console.log("emailSend");
    },
    finalWarning: async function (email, fileNames) {
        console.log("emailSend");
    },
    repoPrint: async function (email, fileNames) {
        console.log("emailSend");
    },
    sendBug: async function (body) {
        var email = await transporter.sendMail({
            from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
            to: "hanna.flores@unt.edu",
            subject: "bugreport",
            html: JSON.stringify(body),
        });
        console.log("emailSend");
    },
};
