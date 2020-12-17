var Q = require("q");
var nodemailer = require("nodemailer");
var emailTemplates = require("email-templates");
var sendMailTransport = require("nodemailer-smtp-transport");

var smtpserver = "mailhost.unt.edu";
var sender = '"SparkOrders" <no-reply.sparkorders@unt.edu>';
var portNum = 25;

module.exports = {
    _template: null,
    _transport: null,

    init: function (config) {
        var d = Q.defer();

        emailTemplates(
            config.emailTplsDir,
            function (err, template) {
                if (err) {
                    return d.reject(err);
                }

                this._template = template;
                this._transport = nodemailer.createTransport({
                    host: smtpserver,
                    port: portNum,
                    secure: false,
                    tls: {
                        rejectUnauthorized: false,
                    },
                });
                return d.resolve();
            }.bind(this)
        );

        return d.promise;
    },

    send: function (to, subject, text, html) {
        var d = Q.defer();
        var params = {
            from: sender,
            to: to,
            subject: subject,
            text: text,
        };

        if (html) {
            params.html = html;
        }

        this._transport.sendMail(params, function (err, res) {
            if (err) {
                console.error(err);
                return d.reject(err);
            } else {
                return d.resolve(res);
            }
        });

        return d.promise;
    },

    sendMail: function (to, subject, tplName, locals) {
        var d = Q.defer();
        var self = this;
        this.init({ emailTplsDir: "emails" }).then(
            function () {
                this._template(tplName, locals, function (err, html, text) {
                    if (err) {
                        console.error(err);
                        return d.reject(err);
                    }

                    self.send(to, subject, text, html).then(function (res) {
                        return d.resolve(res);
                    });
                });
            }.bind(this)
        );

        return d.promise;
    },
};
