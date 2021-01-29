module.exports = {
    apps: [
        {
            name: "sparkorders",
            script: "/home/hcf0018/webserver/TheSparkSubmissionWebsite/deploy.sh",
            watch: true,
            error_file: "/home/hcf0018/webserver/NewLogs/err.log",
            out_file: "/home/hcf0018/webserver/NewLogs/out.log",
            log_file: "/home/hcf0018/webserver/NewLogs/combined.log",
            time: true,
        },
        {
            name: "nodespark",
            script: "/home/hcf0018/webserver/TheSparkSubmissionWebsite/server.js",
            args:
                "--tls-cipher-list='ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL'",
            watch: true,
            error_file: "/home/hcf0018/webserver/NewLogs/err.log",
            out_file: "/home/hcf0018/webserver/NewLogs/out.log",
            log_file: "/home/hcf0018/webserver/NewLogs/combined.log",
            time: true,
            autorestart: true,
        },
    ],
};
