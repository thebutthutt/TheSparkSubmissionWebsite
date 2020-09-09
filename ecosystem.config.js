module.exports = {
    apps : [{
        name: "sparkorders",
        script: "/home/hcf0018/webserver/TheSparkSubmissionWebsite/deploy.sh",
        watch: true,
        error_file: '/home/hcf0018/webserver/logs/err.log',
        out_file: '/home/hcf0018/webserver/logs/out.log',
        log_file: '/home/hcf0018/webserver/logs/combined.log',
        time: true
    }]
  }
  