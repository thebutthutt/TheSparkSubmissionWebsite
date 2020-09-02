#!/usr/bin/bash
cd $(dirname $0)
/usr/bin/node --tls-cipher-list='ECDHE-RSA-AES256-SHA384:AES256-SHA256:!RC4:HIGH:!MD5:!aNULL:!EDH:!EXP:!SSLV2:!eNULL' /home/hcf0018/webserver/TheSparkSubmissionWebsite/server.js