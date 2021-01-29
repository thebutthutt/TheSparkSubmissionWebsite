module.exports = {
    apps: [
        {
            name: "sparkorders",
            script: "npm",
            args: "start",
            watch: true,
            error_file: "/home/hcf0018/webserver/NewLogs/err.log",
            out_file: "/home/hcf0018/webserver/NewLogs/out.log",
            log_file: "/home/hcf0018/webserver/NewLogs/combined.log",
            time: true,
            autorestart: true,
        },
    ],
};
