const secret_key = "9683c083-8e24-44f5-8e5e-4e69186bc015";
const base_url = "https://payments.library.unt.edu/payment/";
const account = "spark-testing";

var nodemailer = require('nodemailer');
var crypto = require('crypto');

module.exports = {

    //generate a URL for the patron to pay thrpugh
    generatePaymentURL: function (contact_name, email, acceptedFiles, acceptedMessages, rejectedFiles, rejectedMessages, amount, submissionID) {
            var concatString = "";
            var newURL = new URL(base_url);
            concatString = concatString.concat(account, amount, contact_name, submissionID, secret_key);

            var otherHash = crypto.createHash('md5').update(concatString).digest("hex");

            newURL.searchParams.append("account", account);
            newURL.searchParams.append("amount", amount);
            newURL.searchParams.append("contact_name", contact_name);
            newURL.searchParams.append("submissionID", submissionID);
            newURL.searchParams.append("libhash", otherHash);

            module.exports.sendEmail(email, acceptedFiles, acceptedMessages, rejectedFiles, rejectedMessages, newURL.href).catch(console.error);
        },

        //validate an incoming payment confirmation url
        validatePaymentURL: function (query, callback) {
            concatString = "";
            var innerMatch = false,
                outerMatch = false;

            var request_contents = JSON.parse(query.request_contents);

            //concatenate all the params
            concatString = concatString.concat(request_contents.account, request_contents.amount, request_contents.contact_name, request_contents.submissionID, secret_key);

            //hash the params
            var otherHash = crypto.createHash('md5').update(concatString).digest("hex");

            //does is match the hash sent over?
            if (otherHash == request_contents.libhash) {
                innerMatch = true;
            }

            concatString = "";
            concatString = concatString.concat(query.account, query.amount, query.request_contents, query.transaction_date, query.transaction_id, secret_key);
            otherHash = crypto.createHash('md5').update(concatString).digest("hex");

            //does is match the hash sent over?
            if (otherHash == query.libhash) {
                outerMatch = true;
            }

            if (typeof callback == 'function') {
                callback(innerMatch, outerMatch, request_contents.submissionID);
            }

        },

        handlePaymentComplete: function (req, callback) {
            //validate the incoming payment confirmation
            this.validatePaymentURL(req.query, function (innerMatch, outerMatch, submissionID) {
                if (innerMatch == true && outerMatch == true) {
                    callback(true, submissionID);
                } else {
                    console.log("Hashes invalid");
                    callback(false, submissionID);
                }
            });
        },
        
        sendEmail: async function (email, acceptedFiles, acceptedMessages, rejectedFiles, rejectedMessages, link) {
            var smtpserver = "mailhost.unt.edu";
            var portNum = 25;
            var fullEmail = `Thank you for your 3D print request with The Spark Makerspace.
            <br><br>
            Our team has reviewed your request and we are ready to print your files. Please follow the link below to complete your payment, and our team will begin printing your files as they arrived in the queue.
            <br><br>
            These files were accepted:
            <ul>
            `;

            for (var i = 0; i < acceptedFiles.length; i++) {
                fullEmail += `<li>${acceptedFiles[i]} \"${acceptedMessages[i]}\" </li>`;
            }

            fullEmail += `</ul>`;
            

            if (rejectedFiles.length > 0) {
                fullEmail += `
                
                <br>These files were rejected:
                <ul>`;

                for (var i = 0; i < rejectedFiles.length; i++) {
                    fullEmail += `<li>${rejectedFiles[i]} \"${rejectedMessages[i]}\" </li>`;
                }

                fullEmail += `</ul>`;
            }

            fullEmail += `
            
            Here is the link to pay for your accepted files:<br>
            <a href=\"${link}\">https://payments.library.unt.edu/</a>
            <br><br>
            After completing your payment, you will recieve an email when your models have been printed. This usually takes between 5 and 7 business days, however, during senior design season, we may be unusually busy. We will try our best to print all our requests as quickly as possible without sacrificing quality. Thank you for chosing The Spark Makerspace!
            `;

            var transporter = nodemailer.createTransport({
                host: smtpserver,
                port: portNum,
                secure: false,
                tls: {rejectUnauthorized: false}
            });

            var email = await transporter.sendMail({
                from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
                to: email,
                subject: 'Your order has been accepted!',
                html: fullEmail
            });
        },

        sendRejected: async function(email, rejectedFiles, rejectedMessages) {

            var smtpserver = "mailhost.unt.edu";
            var portNum = 25;
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

            var transporter = nodemailer.createTransport({
                host: smtpserver,
                port: portNum,
                secure: false,
                tls: {rejectUnauthorized: false}
            });

            var email = await transporter.sendMail({
                from: '"SparkOrders" <no-reply.sparkorders@unt.edu>',
                to: email,
                subject: 'We could not print your order',
                html: fullEmail
            });

        }
}