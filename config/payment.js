const secret_key = "9683c083-8e24-44f5-8e5e-4e69186bc015";
const base_url = "https://payments.library.unt.edu/payment/";
const account = "spark-testing";

var md5 = require('md5');
var crypto = require('crypto');

module.exports = {
    generatePaymentURL: function(contact_name, amount, submissionID) {
        var concatString = "";
        var newURL = new URL(base_url);
        concatString = concatString.concat(account, amount, contact_name, submissionID, secret_key);
        console.log("concatstring", concatString);
        var otherHash = crypto.createHash('md5').update(concatString).digest("hex");
        newURL.searchParams.append("account", account);
        newURL.searchParams.append("amount", amount);
        newURL.searchParams.append("contact_name", contact_name);
        newURL.searchParams.append("submissionID", submissionID);
        newURL.searchParams.append("libhash", otherHash);
        console.log(newURL.toString());

        return newURL;
    },

    validatePaymentURL: function(urlToTest) {
        var concatString = "";
        //turn the url into just the search params
        urlToTest = urlToTest.toString();
        urlToTest = urlToTest.replace("https://payments.library.unt.edu/payment/", "");

        //parse the search params
        var searchParams = new URLSearchParams(urlToTest);

        //concatenate all the params
        concatString.concat(searchParams.get("amount"));
        concatString.concat(searchParams.get("account"));
        concatString.concat(searchParams.get("contact_name"));
        concatString.concat(searchParams.get("submissionID"));
        concatString.concat(secret_key);

        //hash the params
        var hash = md5(concatString);

        //does is match the hash sent over?
        if (hash == searchParams.get("libhash")) {
            console.log("hashes match");
        } else {
            console.log("hashes dont match");
        }

    }
}